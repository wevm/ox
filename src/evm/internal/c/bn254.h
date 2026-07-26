// bn254 (alt_bn128) arithmetic for the EIP-196 and EIP-197 precompiles.
//
// The field is in Montgomery form; see the section below for what that means
// for the constants. Inversion is a binary extended GCD, squaring in the
// cyclotomic subgroup has its own formula, and the hard part of the final
// exponentiation goes four exponent bits at a time.
//
// The tower is the standard one for this curve:
//
//   Fp2  = Fp[u]  / (u^2 + 1)
//   Fp6  = Fp2[v] / (v^3 - xi),  xi = 9 + u
//   Fp12 = Fp6[w] / (w^2 - v)

#ifndef OX_EVM_BN254_H
#define OX_EVM_BN254_H

#include "safegcd.h"
#include "u256.h"

// p = 36u^4 + 36u^3 + 24u^2 + 6u + 1 for the curve parameter u below.
// Both the prime and the final exponentiation are polynomials in it.
#define BN_U 4965661367192848881ULL
#define BN_P0 0x3C208C16D87CFD47ULL
#define BN_P1 0x97816A916871CA8DULL
#define BN_P2 0xB85045B68181585DULL
#define BN_P3 0x30644E72E131A029ULL
#define BN_P ((u256){{BN_P0, BN_P1, BN_P2, BN_P3}})
// The same limbs as an array, so the field routines can index them without
// materialising a compound literal on every use.
static const uint64_t bn_p_l[4] = {BN_P0, BN_P1, BN_P2, BN_P3};
// The order of both groups.
#define BN_R                                                       \
  ((u256){{0x43E1F593F0000001ULL, 0x2833E84879B97091ULL,           \
           0xB85045B68181585DULL, 0x30644E72E131A029ULL}})

static inline u256 fq_add(u256 a, u256 b) {
  const u256 r = u256_add(a, b);
  // p is below 2^254, so a wrap cannot happen and one subtraction suffices.
  return u256_cmp(r, BN_P) >= 0 ? u256_sub(r, BN_P) : r;
}

static inline u256 fq_sub(u256 a, u256 b) {
  return u256_cmp(a, b) < 0 ? u256_add(u256_sub(a, b), BN_P) : u256_sub(a, b);
}

static inline u256 fq_neg(u256 a) {
  return u256_is_zero(a) ? a : u256_sub(BN_P, a);
}

// ---------------------------------------------------------------------------
// Montgomery form
//
// This prime has none of the structure that lets secp256k1's fold work, so the
// reduction is Montgomery's: field elements are held as `a * R mod p` with
// R = 2^256, and a multiplication is a 256x256 product followed by four
// rounds that divide by R without ever dividing. That replaces the generic
// `u256_mulmod`, whose 512-by-256 Knuth division cost about 90 ns per field
// multiplication and put a pairing in the tens of milliseconds.
//
// Everything between `g1_decode`/`g2_decode` and `g1_encode` is in Montgomery
// form, including the constants: `bn_one` is R mod p, not 1. The exponents are
// not — `fq_pow` and the Frobenius derivation take ordinary integers.
//
// The constants are derived at startup rather than transcribed, in the same
// spirit as the Frobenius table below.
// ---------------------------------------------------------------------------

static uint64_t bn_n0;  // -p^-1 mod 2^64
static u256 bn_one;     // R mod p, the Montgomery representation of 1
static u256 bn_r2;      // R^2 mod p, which converts into Montgomery form
static u256 bn_r3;      // R^3 mod p, which the extended-GCD inverse needs
static u256 bn_three;   // 3R mod p, the curve constant
static int bn_mont_ready;

/**
 * Montgomery reduction of a 512-bit product, in place.
 *
 * `t` needs a ninth limb for the carry the last round can push past the top.
 * With both inputs below p the result is below 2p, so one conditional
 * subtraction finishes it.
 */
static inline u256 mont_redc(uint64_t t[9]) {
  for (int i = 0; i < 4; i++) {
    const uint64_t m = t[i] * bn_n0;
    uint64_t carry = 0;
    for (int j = 0; j < 4; j++) {
      uint64_t lo, hi;
      mul64(m, bn_p_l[j], &lo, &hi);
      uint64_t s = t[i + j] + lo;
      hi += (s < lo);
      const uint64_t s2 = s + carry;
      hi += (s2 < s);
      t[i + j] = s2;
      carry = hi;
    }
    for (int j = i + 4; j < 9 && carry; j++) {
      const uint64_t s = t[j] + carry;
      carry = (s < carry);
      t[j] = s;
    }
  }
  u256 r = {{t[4], t[5], t[6], t[7]}};
  if (t[8] || u256_cmp(r, BN_P) >= 0) r = u256_sub(r, BN_P);
  return r;
}

/**
 * Montgomery multiplication, coarsely integrated (CIOS).
 *
 * Interleaving the reduction with the product keeps the running value in six
 * words instead of building a nine-word 512-bit intermediate and walking it
 * again: the same 32 multiplies, but a working set small enough to stay in
 * registers. The tower above runs several tens of thousands of these per
 * pairing, and the separate form was spending more on the intermediate than on
 * the arithmetic.
 */
static inline u256 mont_mul(u256 a, u256 b) {
  uint64_t t[6] = {0, 0, 0, 0, 0, 0};
  for (int i = 0; i < 4; i++) {
    uint64_t c = 0;
    for (int j = 0; j < 4; j++) {
      uint64_t lo, hi;
      mul64(a.l[j], b.l[i], &lo, &hi);
      uint64_t s = t[j] + lo;
      hi += (s < lo);
      s += c;
      hi += (s < c);
      t[j] = s;
      c = hi;
    }
    uint64_t s = t[4] + c;
    t[5] = (s < c);
    t[4] = s;

    const uint64_t m = t[0] * bn_n0;
    uint64_t lo, hi;
    mul64(m, bn_p_l[0], &lo, &hi);
    // The low word cancels by construction; only its carry survives.
    c = hi + ((t[0] + lo) < lo);
    for (int j = 1; j < 4; j++) {
      mul64(m, bn_p_l[j], &lo, &hi);
      uint64_t v = t[j] + lo;
      hi += (v < lo);
      v += c;
      hi += (v < c);
      t[j - 1] = v;
      c = hi;
    }
    s = t[4] + c;
    t[3] = s;
    t[4] = t[5] + (s < c);
  }
  u256 r = {{t[0], t[1], t[2], t[3]}};
  if (t[4] || u256_cmp(r, BN_P) >= 0) r = u256_sub(r, BN_P);
  return r;
}

static inline u256 fq_mul(u256 a, u256 b) { return mont_mul(a, b); }
static inline u256 fq_sqr(u256 a) { return mont_mul(a, a); }

/** Into Montgomery form: `a * R2 * R^-1 = a * R`. */
static inline u256 fq_to_mont(u256 a) { return mont_mul(a, bn_r2); }

/** Out of Montgomery form: reducing `a` alone divides it by R. */
static inline u256 fq_from_mont(u256 a) {
  uint64_t t[9] = {a.l[0], a.l[1], a.l[2], a.l[3], 0, 0, 0, 0, 0};
  return mont_redc(t);
}

/** Derives the Montgomery constants. Idempotent. */
static void bn_mont_init(void) {
  if (bn_mont_ready) return;
  // -p^-1 mod 2^64 by Hensel lifting: each step doubles the number of correct
  // bits, so six take one bit to sixty-four.
  uint64_t inv = 1;
  for (int i = 0; i < 6; i++) inv *= 2 - BN_P0 * inv;
  bn_n0 = (uint64_t)0 - inv;
  // R mod p. The wrapping negation of p is 2^256 - p, which is under 5p.
  u256 r1 = u256_sub(U256_ZERO, BN_P);
  while (u256_cmp(r1, BN_P) >= 0) r1 = u256_sub(r1, BN_P);
  bn_one = r1;
  // R^2, the one place the generic path is still used — once per process.
  bn_r2 = u256_mulmod(r1, r1, BN_P);
  bn_mont_ready = 1;
  bn_r3 = mont_mul(bn_r2, bn_r2);
  bn_three = fq_to_mont(u256_from_u64(3));
}

// Declared here because the decoders call it and it is defined further down,
// with the Frobenius table it derives.
static void bn_init(void);

// The same prime as five limbs of 62 bits, for `safegcd.h`.
#define SG_BN_LIMBS 5
static const int64_t SG_BN_P[SG_BN_LIMBS] = {
    0x3C208C16D87CFD47LL, 0x1E05AA45A1C72A34LL, 0x05045B68181585D9LL,
    0x19139CB84C680A6ELL, 0x0000000000000030LL};
#define SG_BN_INV62 0x382DF87D1B799C77ULL

/**
 * `a^-1 mod p`, by Bernstein-Yang safegcd.
 *
 * Fermat's `a^(p-2)` is 256 squarings and about 128 multiplications, and the
 * binary extended GCD that replaced it is roughly 360 iterations of
 * shift-compare-subtract over the full width. safegcd folds 62 of those steps
 * at a time into a 2x2 matrix read off the low bits; see `safegcd.h`. It
 * matters because the Miller loop inverts twice per iteration — normalising
 * the running point, and again for the line's slope.
 *
 * The GCD works on the integer it is handed, so on `aR` it returns
 * `a^-1 R^-1`. Multiplying by `R^3` in Montgomery form lands back on `a^-1 R`.
 * `a` must already be reduced.
 */
static u256 fq_inv(u256 a) {
  if (u256_is_zero(a)) return U256_ZERO;
  sg62 x;
  sg_from64(&x, a.l, 4, SG_BN_LIMBS);
  sg_inv(SG_BN_LIMBS, &x, SG_BN_P, SG_BN_INV62);
  u256 r;
  sg_to64(r.l, 4, &x, SG_BN_LIMBS);
  return mont_mul(r, bn_r3);
}

// ---------------------------------------------------------------------------
// Fp2 = Fp[u] / (u^2 + 1)
// ---------------------------------------------------------------------------

typedef struct {
  u256 c0, c1; // c0 + c1*u
} fq2;

#define FQ2_ZERO ((fq2){U256_ZERO, U256_ZERO})
// `bn_one` is R mod p; see the Montgomery section. Valid only after
// `bn_init`, which every path into this file goes through.
#define FQ2_ONE ((fq2){bn_one, U256_ZERO})

static inline int fq2_is_zero(fq2 a) {
  return u256_is_zero(a.c0) && u256_is_zero(a.c1);
}
static inline int fq2_eq(fq2 a, fq2 b) {
  return u256_eq(a.c0, b.c0) && u256_eq(a.c1, b.c1);
}
static inline fq2 fq2_add(fq2 a, fq2 b) {
  return (fq2){fq_add(a.c0, b.c0), fq_add(a.c1, b.c1)};
}
static inline fq2 fq2_sub(fq2 a, fq2 b) {
  return (fq2){fq_sub(a.c0, b.c0), fq_sub(a.c1, b.c1)};
}
static inline fq2 fq2_neg(fq2 a) { return (fq2){fq_neg(a.c0), fq_neg(a.c1)}; }

static inline fq2 fq2_mul(fq2 a, fq2 b) {
  // Karatsuba: u^2 = -1, so the cross terms subtract.
  const u256 v0 = fq_mul(a.c0, b.c0);
  const u256 v1 = fq_mul(a.c1, b.c1);
  const u256 mid = fq_mul(fq_add(a.c0, a.c1), fq_add(b.c0, b.c1));
  return (fq2){fq_sub(v0, v1), fq_sub(fq_sub(mid, v0), v1)};
}

static inline fq2 fq2_sqr(fq2 a) {
  // (c0 + c1 u)^2 = (c0+c1)(c0-c1) + 2 c0 c1 u
  const u256 t0 = fq_mul(fq_add(a.c0, a.c1), fq_sub(a.c0, a.c1));
  const u256 t1 = fq_mul(a.c0, a.c1);
  return (fq2){t0, fq_add(t1, t1)};
}

static inline fq2 fq2_mul_fq(fq2 a, u256 b) {
  return (fq2){fq_mul(a.c0, b), fq_mul(a.c1, b)};
}

static inline fq2 fq2_inv(fq2 a) {
  // The norm c0^2 + c1^2 lives in Fp, so one Fp inversion suffices.
  const u256 norm = fq_add(fq_sqr(a.c0), fq_sqr(a.c1));
  const u256 ninv = fq_inv(norm);
  return (fq2){fq_mul(a.c0, ninv), fq_neg(fq_mul(a.c1, ninv))};
}

/** Multiplication by xi = 9 + u, the non-residue that defines Fp6. */
static inline fq2 fq2_mul_xi(fq2 a) {
  // (c0 + c1 u)(9 + u) = (9 c0 - c1) + (c0 + 9 c1) u
  u256 nine_c0 = fq_add(a.c0, a.c0);        // 2
  nine_c0 = fq_add(nine_c0, nine_c0);      // 4
  nine_c0 = fq_add(nine_c0, nine_c0);      // 8
  nine_c0 = fq_add(nine_c0, a.c0);         // 9
  u256 nine_c1 = fq_add(a.c1, a.c1);
  nine_c1 = fq_add(nine_c1, nine_c1);
  nine_c1 = fq_add(nine_c1, nine_c1);
  nine_c1 = fq_add(nine_c1, a.c1);
  return (fq2){fq_sub(nine_c0, a.c1), fq_add(a.c0, nine_c1)};
}

/** The p-power Frobenius on Fp2 is conjugation. */
static inline fq2 fq2_conj(fq2 a) { return (fq2){a.c0, fq_neg(a.c1)}; }

// ---------------------------------------------------------------------------
// G1: y^2 = x^3 + 3 over Fp, in Jacobian coordinates
// ---------------------------------------------------------------------------

typedef struct {
  u256 x, y, z;
} g1;

#define G1_INF ((g1){bn_one, bn_one, U256_ZERO})

static inline int g1_is_inf(const g1 *p) { return u256_is_zero(p->z); }

static void g1_double(g1 *r, const g1 *p) {
  if (g1_is_inf(p) || u256_is_zero(p->y)) {
    *r = G1_INF;
    return;
  }
  // dbl-2009-l, valid because the curve's `a` coefficient is zero.
  const u256 A = fq_sqr(p->x);
  const u256 B = fq_sqr(p->y);
  const u256 C = fq_sqr(B);
  u256 D = fq_sqr(fq_add(p->x, B));
  D = fq_sub(D, A);
  D = fq_sub(D, C);
  D = fq_add(D, D);
  const u256 E = fq_add(fq_add(A, A), A);
  const u256 F = fq_sqr(E);
  const u256 x3 = fq_sub(F, fq_add(D, D));
  u256 c8 = fq_add(C, C);
  c8 = fq_add(c8, c8);
  c8 = fq_add(c8, c8);
  u256 y3 = fq_mul(E, fq_sub(D, x3));
  y3 = fq_sub(y3, c8);
  u256 z3 = fq_mul(p->y, p->z);
  z3 = fq_add(z3, z3);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void g1_add(g1 *r, const g1 *p, const g1 *q) {
  if (g1_is_inf(p)) {
    *r = *q;
    return;
  }
  if (g1_is_inf(q)) {
    *r = *p;
    return;
  }
  // Both affine, which is what the precompile decodes: mmadd-2007-bl at 4M+2S
  // rather than the general 11M+5S, most of which would be squaring one and
  // multiplying by it.
  if (u256_eq(p->z, bn_one) && u256_eq(q->z, bn_one)) {
    const u256 h = fq_sub(q->x, p->x);
    if (u256_is_zero(h)) {
      if (u256_eq(p->y, q->y)) {
        g1_double(r, p);
        return;
      }
      *r = G1_INF;
      return;
    }
    const u256 hh = fq_sqr(h);
    u256 i = fq_add(hh, hh);
    i = fq_add(i, i);
    const u256 j = fq_mul(h, i);
    const u256 rr = fq_add(fq_sub(q->y, p->y), fq_sub(q->y, p->y));
    const u256 v = fq_mul(p->x, i);
    const u256 x3 = fq_sub(fq_sub(fq_sqr(rr), j), fq_add(v, v));
    u256 y1j = fq_mul(p->y, j);
    y1j = fq_add(y1j, y1j);
    r->x = x3;
    r->y = fq_sub(fq_mul(rr, fq_sub(v, x3)), y1j);
    r->z = fq_add(h, h);
    return;
  }
  const u256 z1z1 = fq_sqr(p->z);
  const u256 z2z2 = fq_sqr(q->z);
  const u256 u1 = fq_mul(p->x, z2z2);
  const u256 u2 = fq_mul(q->x, z1z1);
  const u256 s1 = fq_mul(fq_mul(p->y, z2z2), q->z);
  const u256 s2 = fq_mul(fq_mul(q->y, z1z1), p->z);
  const u256 h = fq_sub(u2, u1);
  const u256 rr = fq_sub(s2, s1);
  if (u256_is_zero(h)) {
    if (u256_is_zero(rr)) {
      g1_double(r, p);
      return;
    }
    *r = G1_INF;
    return;
  }
  const u256 h2 = fq_add(h, h);
  const u256 i = fq_sqr(h2);
  const u256 j = fq_mul(h, i);
  const u256 r2 = fq_add(rr, rr);
  const u256 v = fq_mul(u1, i);
  u256 x3 = fq_sqr(r2);
  x3 = fq_sub(x3, j);
  x3 = fq_sub(x3, fq_add(v, v));
  u256 y3 = fq_mul(r2, fq_sub(v, x3));
  const u256 s1j = fq_mul(s1, j);
  y3 = fq_sub(y3, fq_add(s1j, s1j));
  u256 z3 = fq_sqr(fq_add(p->z, q->z));
  z3 = fq_sub(z3, z1z1);
  z3 = fq_sub(z3, z2z2);
  z3 = fq_mul(z3, h);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

/** `k * p`, double-and-add from the top bit. `k` is not reduced. */
static void g1_mul(g1 *out, const g1 *p, u256 k) {
  g1 acc = G1_INF;
  for (int bit = 255; bit >= 0; bit--) {
    g1 t;
    g1_double(&t, &acc);
    acc = t;
    if ((k.l[bit / 64] >> (bit % 64)) & 1) {
      g1_add(&t, &acc, p);
      acc = t;
    }
  }
  *out = acc;
}

/** Converts to affine. Writes zeroes for the point at infinity, per EIP-196. */
static void g1_affine(const g1 *p, u256 *x, u256 *y) {
  if (g1_is_inf(p)) {
    *x = U256_ZERO;
    *y = U256_ZERO;
    return;
  }
  const u256 zinv = fq_inv(p->z);
  const u256 zinv2 = fq_sqr(zinv);
  *x = fq_mul(p->x, zinv2);
  *y = fq_mul(p->y, fq_mul(zinv2, zinv));
}

/**
 * Decodes an affine G1 point from 64 big-endian bytes.
 *
 * Returns 0 if a coordinate is not a field element or the point is not on the
 * curve. `(0, 0)` is the encoding of the point at infinity and is accepted.
 */
static int g1_decode(const uint8_t *in, g1 *out) {
  bn_init();
  const u256 xr = u256_from_be(in);
  const u256 yr = u256_from_be(in + 32);
  // The range check is on the encoded value, before the lift.
  if (u256_cmp(xr, BN_P) >= 0 || u256_cmp(yr, BN_P) >= 0) return 0;
  if (u256_is_zero(xr) && u256_is_zero(yr)) {
    *out = G1_INF;
    return 1;
  }
  const u256 x = fq_to_mont(xr);
  const u256 y = fq_to_mont(yr);
  // y^2 == x^3 + 3
  const u256 lhs = fq_sqr(y);
  const u256 rhs = fq_add(fq_mul(fq_sqr(x), x), bn_three);
  if (!u256_eq(lhs, rhs)) return 0;
  out->x = x;
  out->y = y;
  out->z = bn_one;
  return 1;
}

/** Affine coordinates as 64 big-endian bytes, back in ordinary form. */
static void g1_encode(const g1 *p, uint8_t *out) {
  u256 x, y;
  g1_affine(p, &x, &y);
  u256_to_be(fq_from_mont(x), out);
  u256_to_be(fq_from_mont(y), out + 32);
}

// ---------------------------------------------------------------------------
// Fp6 = Fp2[v] / (v^3 - xi)
// ---------------------------------------------------------------------------

typedef struct {
  fq2 c0, c1, c2; // c0 + c1*v + c2*v^2
} fq6;

#define FQ6_ZERO ((fq6){FQ2_ZERO, FQ2_ZERO, FQ2_ZERO})
#define FQ6_ONE ((fq6){FQ2_ONE, FQ2_ZERO, FQ2_ZERO})

static inline fq6 fq6_add(fq6 a, fq6 b) {
  return (fq6){fq2_add(a.c0, b.c0), fq2_add(a.c1, b.c1), fq2_add(a.c2, b.c2)};
}
static inline fq6 fq6_sub(fq6 a, fq6 b) {
  return (fq6){fq2_sub(a.c0, b.c0), fq2_sub(a.c1, b.c1), fq2_sub(a.c2, b.c2)};
}
static inline fq6 fq6_neg(fq6 a) {
  return (fq6){fq2_neg(a.c0), fq2_neg(a.c1), fq2_neg(a.c2)};
}
static inline int fq6_is_zero(fq6 a) {
  return fq2_is_zero(a.c0) && fq2_is_zero(a.c1) && fq2_is_zero(a.c2);
}
static inline int fq6_eq(fq6 a, fq6 b) {
  return fq2_eq(a.c0, b.c0) && fq2_eq(a.c1, b.c1) && fq2_eq(a.c2, b.c2);
}

static fq6 fq6_mul(fq6 a, fq6 b) {
  // Karatsuba over the three coefficients; v^3 folds back as xi.
  const fq2 t0 = fq2_mul(a.c0, b.c0);
  const fq2 t1 = fq2_mul(a.c1, b.c1);
  const fq2 t2 = fq2_mul(a.c2, b.c2);
  fq2 s = fq2_mul(fq2_add(a.c1, a.c2), fq2_add(b.c1, b.c2));
  const fq2 c0 = fq2_add(t0, fq2_mul_xi(fq2_sub(fq2_sub(s, t1), t2)));
  s = fq2_mul(fq2_add(a.c0, a.c1), fq2_add(b.c0, b.c1));
  const fq2 c1 = fq2_add(fq2_sub(fq2_sub(s, t0), t1), fq2_mul_xi(t2));
  s = fq2_mul(fq2_add(a.c0, a.c2), fq2_add(b.c0, b.c2));
  const fq2 c2 = fq2_add(fq2_sub(fq2_sub(s, t0), t2), t1);
  return (fq6){c0, c1, c2};
}

static inline fq6 fq6_sqr(fq6 a) { return fq6_mul(a, a); }

/** Multiplication by `v`, which cycles the coefficients. */
static inline fq6 fq6_mul_v(fq6 a) {
  return (fq6){fq2_mul_xi(a.c2), a.c0, a.c1};
}

static fq6 fq6_inv(fq6 a) {
  const fq2 t0 = fq2_sub(fq2_sqr(a.c0), fq2_mul_xi(fq2_mul(a.c1, a.c2)));
  const fq2 t1 = fq2_sub(fq2_mul_xi(fq2_sqr(a.c2)), fq2_mul(a.c0, a.c1));
  const fq2 t2 = fq2_sub(fq2_sqr(a.c1), fq2_mul(a.c0, a.c2));
  fq2 d = fq2_mul(a.c0, t0);
  d = fq2_add(d, fq2_mul_xi(fq2_mul(a.c2, t1)));
  d = fq2_add(d, fq2_mul_xi(fq2_mul(a.c1, t2)));
  const fq2 di = fq2_inv(d);
  return (fq6){fq2_mul(t0, di), fq2_mul(t1, di), fq2_mul(t2, di)};
}

// ---------------------------------------------------------------------------
// Fp12 = Fp6[w] / (w^2 - v)
// ---------------------------------------------------------------------------

typedef struct {
  fq6 c0, c1; // c0 + c1*w
} fq12;

#define FQ12_ONE ((fq12){FQ6_ONE, FQ6_ZERO})

static inline int fq12_is_one(fq12 a) {
  return fq6_eq(a.c0, FQ6_ONE) && fq6_is_zero(a.c1);
}
static inline fq12 fq12_conj(fq12 a) { return (fq12){a.c0, fq6_neg(a.c1)}; }

static fq12 fq12_mul(fq12 a, fq12 b) {
  const fq6 t0 = fq6_mul(a.c0, b.c0);
  const fq6 t1 = fq6_mul(a.c1, b.c1);
  const fq6 c0 = fq6_add(t0, fq6_mul_v(t1));
  fq6 c1 = fq6_mul(fq6_add(a.c0, a.c1), fq6_add(b.c0, b.c1));
  c1 = fq6_sub(fq6_sub(c1, t0), t1);
  return (fq12){c0, c1};
}

/** `a * (b0, 0, 0)`. */
static inline fq6 fq6_mul_fq2(fq6 a, fq2 b) {
  return (fq6){fq2_mul(a.c0, b), fq2_mul(a.c1, b), fq2_mul(a.c2, b)};
}

/**
 * `a * (b0, b1, 0)`, in five multiplications rather than the general six.
 *
 * Only `a2*b1` and `a2*b0` are not already Karatsuba by-products of the two
 * diagonal terms, and each costs one product against a sum.
 */
static fq6 fq6_mul_01(fq6 a, fq2 b0, fq2 b1) {
  const fq2 v0 = fq2_mul(a.c0, b0);
  const fq2 v1 = fq2_mul(a.c1, b1);
  const fq2 a2b1 = fq2_sub(fq2_mul(fq2_add(a.c1, a.c2), b1), v1);
  const fq2 a2b0 = fq2_sub(fq2_mul(fq2_add(a.c0, a.c2), b0), v0);
  const fq2 mid = fq2_mul(fq2_add(a.c0, a.c1), fq2_add(b0, b1));
  return (fq6){fq2_add(v0, fq2_mul_xi(a2b1)),
               fq2_sub(fq2_sub(mid, v0), v1), fq2_add(v1, a2b0)};
}

/** The three non-zero coefficients a line evaluation produces. */
typedef struct {
  fq2 l0, l3, l4;
} fq12_line;

/**
 * `a * line`, where `line` is `(l0, 0, 0) + (l3, l4, 0) w`.
 *
 * A line evaluation fills three of an Fp12's six Fp2 coefficients and the
 * Miller loop multiplies by one every iteration, so running the general
 * product means eighteen Fp2 multiplications where thirteen suffice — and,
 * because the loop is a dependent chain on `f`, the saving is on the critical
 * path rather than on throughput.
 */
static fq12 fq12_mul_line(fq12 a, fq12_line b) {
  const fq6 t0 = fq6_mul_fq2(a.c0, b.l0);
  const fq6 t1 = fq6_mul_01(a.c1, b.l3, b.l4);
  const fq6 c0 = fq6_add(t0, fq6_mul_v(t1));
  fq6 c1 = fq6_mul_01(fq6_add(a.c0, a.c1), fq2_add(b.l0, b.l3), b.l4);
  c1 = fq6_sub(fq6_sub(c1, t0), t1);
  return (fq12){c0, c1};
}

/**
 * Squaring in Fp12, as a complex squaring over Fp6.
 *
 * `(c0 + c1 w)^2 = (c0 + c1)(c0 + v c1) - c0 c1 - v c0 c1  +  2 c0 c1 w`,
 * which is two Fp6 multiplications where the general product needs three.
 */
static fq12 fq12_sqr(fq12 a) {
  const fq6 t = fq6_mul(a.c0, a.c1);
  const fq6 c0 =
      fq6_sub(fq6_sub(fq6_mul(fq6_add(a.c0, a.c1), fq6_add(a.c0, fq6_mul_v(a.c1))),
                      t),
              fq6_mul_v(t));
  return (fq12){c0, fq6_add(t, t)};
}

/**
 * Squaring restricted to the cyclotomic subgroup, after Granger and Scott.
 *
 * Once the easy part of the final exponentiation has run, the element
 * satisfies `f^(p^6+1) = 1`. On that subgroup the twelve Fp2 coefficients
 * regroup into three Fp4 squarings, which is six Fp2 multiplications against
 * the eighteen a general Fp12 squaring costs. The hard part is a few hundred
 * squarings, so this is most of it.
 *
 * The coefficients are read out in the `w`-power order the formula is stated
 * in: with `w^2 = v`, the Fp6 pair `(c0, c1)` interleaves as
 * `c0.c0, c1.c0, c0.c1, c1.c1, c0.c2, c1.c2`.
 *
 * Only valid on the subgroup — `fq12_sqr` is the one to use anywhere else.
 */
static fq12 fq12_cyclo_sqr(fq12 a) {
  fq2 z0 = a.c0.c0, z4 = a.c0.c1, z3 = a.c0.c2;
  fq2 z2 = a.c1.c0, z1 = a.c1.c1, z5 = a.c1.c2;

  // Three Fp4 squarings, each `(x + y*s)^2` with `s^2 = xi`.
  fq2 tmp = fq2_mul(z0, z1);
  const fq2 t0 = fq2_sub(
      fq2_sub(fq2_mul(fq2_add(z0, z1), fq2_add(z0, fq2_mul_xi(z1))), tmp),
      fq2_mul_xi(tmp));
  const fq2 t1 = fq2_add(tmp, tmp);

  tmp = fq2_mul(z2, z3);
  const fq2 t2 = fq2_sub(
      fq2_sub(fq2_mul(fq2_add(z2, z3), fq2_add(z2, fq2_mul_xi(z3))), tmp),
      fq2_mul_xi(tmp));
  const fq2 t3 = fq2_add(tmp, tmp);

  tmp = fq2_mul(z4, z5);
  const fq2 t4 = fq2_sub(
      fq2_sub(fq2_mul(fq2_add(z4, z5), fq2_add(z4, fq2_mul_xi(z5))), tmp),
      fq2_mul_xi(tmp));
  const fq2 t5 = fq2_add(tmp, tmp);

  // z <- 3t +/- 2z, the step that makes this a squaring rather than a square.
  z0 = fq2_sub(t0, z0);
  z0 = fq2_add(z0, z0);
  z0 = fq2_add(z0, t0);
  z1 = fq2_add(t1, z1);
  z1 = fq2_add(z1, z1);
  z1 = fq2_add(z1, t1);

  tmp = fq2_mul_xi(t5);
  z2 = fq2_add(tmp, z2);
  z2 = fq2_add(z2, z2);
  z2 = fq2_add(z2, tmp);
  z3 = fq2_sub(t4, z3);
  z3 = fq2_add(z3, z3);
  z3 = fq2_add(z3, t4);

  z4 = fq2_sub(t2, z4);
  z4 = fq2_add(z4, z4);
  z4 = fq2_add(z4, t2);
  z5 = fq2_add(t3, z5);
  z5 = fq2_add(z5, z5);
  z5 = fq2_add(z5, t3);

  return (fq12){{z0, z4, z3}, {z2, z1, z5}};
}

static fq12 fq12_inv(fq12 a) {
  // (c0 + c1 w)(c0 - c1 w) = c0^2 - v c1^2, which lies in Fp6.
  const fq6 d = fq6_sub(fq6_sqr(a.c0), fq6_mul_v(fq6_sqr(a.c1)));
  const fq6 di = fq6_inv(d);
  return (fq12){fq6_mul(a.c0, di), fq6_neg(fq6_mul(a.c1, di))};
}

/**
 * The p-power Frobenius.
 *
 * `gamma[i]` is `xi^(i*(p-1)/6)`, derived at runtime by {@link bn_init} rather
 * than transcribed. Conjugating each Fp2 coefficient handles the Fp2 part; the
 * powers of `v` and `w` pick up the gammas because `v = w^2`.
 */
static fq2 bn_gamma[6];

static fq2 fq2_pow(fq2 a, u256 e) {
  fq2 r = FQ2_ONE;
  for (int bit = 255; bit >= 0; bit--) {
    r = fq2_sqr(r);
    if ((e.l[bit / 64] >> (bit % 64)) & 1) r = fq2_mul(r, a);
  }
  return r;
}

/** Derives the Frobenius constants. Idempotent; called before any pairing. */
static void bn_init(void) {
  bn_mont_init();
  if (!fq2_is_zero(bn_gamma[1])) return;
  const fq2 xi = (fq2){fq_to_mont(u256_from_u64(9)), bn_one};
  // (p - 1) / 6
  uint64_t rem;
  const u256 e = u256_divmod_u64(u256_sub(BN_P, U256_ONE), 6, &rem);
  bn_gamma[0] = FQ2_ONE;
  bn_gamma[1] = fq2_pow(xi, e);
  for (int i = 2; i < 6; i++) bn_gamma[i] = fq2_mul(bn_gamma[i - 1], bn_gamma[1]);
}

static fq12 fq12_frobenius(fq12 a) {
  fq6 c0, c1;
  c0.c0 = fq2_conj(a.c0.c0);
  c0.c1 = fq2_mul(fq2_conj(a.c0.c1), bn_gamma[2]);
  c0.c2 = fq2_mul(fq2_conj(a.c0.c2), bn_gamma[4]);
  c1.c0 = fq2_mul(fq2_conj(a.c1.c0), bn_gamma[1]);
  c1.c1 = fq2_mul(fq2_conj(a.c1.c1), bn_gamma[3]);
  c1.c2 = fq2_mul(fq2_conj(a.c1.c2), bn_gamma[5]);
  return (fq12){c0, c1};
}


// ---------------------------------------------------------------------------
// G2: y^2 = x^3 + 3/xi over Fp2, in Jacobian coordinates
// ---------------------------------------------------------------------------

typedef struct {
  fq2 x, y, z;
} g2;

#define G2_INF ((g2){FQ2_ONE, FQ2_ONE, FQ2_ZERO})

static inline int g2_is_inf(const g2 *p) { return fq2_is_zero(p->z); }

/** The twist's curve constant, `3 / xi`. */
static inline fq2 g2_b(void) {
  const fq2 xi = (fq2){fq_to_mont(u256_from_u64(9)), bn_one};
  return fq2_mul_fq(fq2_inv(xi), bn_three);
}

static void g2_double(g2 *r, const g2 *p) {
  if (g2_is_inf(p) || fq2_is_zero(p->y)) {
    *r = G2_INF;
    return;
  }
  const fq2 A = fq2_sqr(p->x);
  const fq2 B = fq2_sqr(p->y);
  const fq2 C = fq2_sqr(B);
  fq2 D = fq2_sqr(fq2_add(p->x, B));
  D = fq2_sub(D, A);
  D = fq2_sub(D, C);
  D = fq2_add(D, D);
  const fq2 E = fq2_add(fq2_add(A, A), A);
  const fq2 F = fq2_sqr(E);
  const fq2 x3 = fq2_sub(F, fq2_add(D, D));
  fq2 c8 = fq2_add(C, C);
  c8 = fq2_add(c8, c8);
  c8 = fq2_add(c8, c8);
  fq2 y3 = fq2_mul(E, fq2_sub(D, x3));
  y3 = fq2_sub(y3, c8);
  fq2 z3 = fq2_mul(p->y, p->z);
  z3 = fq2_add(z3, z3);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void g2_add(g2 *r, const g2 *p, const g2 *q) {
  if (g2_is_inf(p)) {
    *r = *q;
    return;
  }
  if (g2_is_inf(q)) {
    *r = *p;
    return;
  }
  const fq2 z1z1 = fq2_sqr(p->z);
  const fq2 z2z2 = fq2_sqr(q->z);
  const fq2 u1 = fq2_mul(p->x, z2z2);
  const fq2 u2 = fq2_mul(q->x, z1z1);
  const fq2 s1 = fq2_mul(fq2_mul(p->y, z2z2), q->z);
  const fq2 s2 = fq2_mul(fq2_mul(q->y, z1z1), p->z);
  const fq2 h = fq2_sub(u2, u1);
  const fq2 rr = fq2_sub(s2, s1);
  if (fq2_is_zero(h)) {
    if (fq2_is_zero(rr)) {
      g2_double(r, p);
      return;
    }
    *r = G2_INF;
    return;
  }
  const fq2 h2 = fq2_add(h, h);
  const fq2 i = fq2_sqr(h2);
  const fq2 j = fq2_mul(h, i);
  const fq2 r2 = fq2_add(rr, rr);
  const fq2 v = fq2_mul(u1, i);
  fq2 x3 = fq2_sqr(r2);
  x3 = fq2_sub(x3, j);
  x3 = fq2_sub(x3, fq2_add(v, v));
  fq2 y3 = fq2_mul(r2, fq2_sub(v, x3));
  const fq2 s1j = fq2_mul(s1, j);
  y3 = fq2_sub(y3, fq2_add(s1j, s1j));
  fq2 z3 = fq2_sqr(fq2_add(p->z, q->z));
  z3 = fq2_sub(z3, z1z1);
  z3 = fq2_sub(z3, z2z2);
  z3 = fq2_mul(z3, h);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void g2_mul(g2 *out, const g2 *p, u256 k) {
  g2 acc = G2_INF;
  for (int bit = 255; bit >= 0; bit--) {
    g2 t;
    g2_double(&t, &acc);
    acc = t;
    if ((k.l[bit / 64] >> (bit % 64)) & 1) {
      g2_add(&t, &acc, p);
      acc = t;
    }
  }
  *out = acc;
}

/**
 * Decodes an affine G2 point from 128 big-endian bytes.
 *
 * EIP-197 puts the coefficient of `u` first in each Fp2 element. The point must
 * be on the curve and in the order-r subgroup; `(0, 0)` is infinity.
 */
static int g2_decode(const uint8_t *in, g2 *out) {
  bn_init();
  const u256 x1 = u256_from_be(in);
  const u256 x0 = u256_from_be(in + 32);
  const u256 y1 = u256_from_be(in + 64);
  const u256 y0 = u256_from_be(in + 96);
  // The range check is on the encoded values, before the lift.
  if (u256_cmp(x0, BN_P) >= 0 || u256_cmp(x1, BN_P) >= 0 ||
      u256_cmp(y0, BN_P) >= 0 || u256_cmp(y1, BN_P) >= 0)
    return 0;
  const fq2 x = (fq2){fq_to_mont(x0), fq_to_mont(x1)};
  const fq2 y = (fq2){fq_to_mont(y0), fq_to_mont(y1)};
  if (fq2_is_zero(x) && fq2_is_zero(y)) {
    *out = G2_INF;
    return 1;
  }
  if (!fq2_eq(fq2_sqr(y), fq2_add(fq2_mul(fq2_sqr(x), x), g2_b()))) return 0;
  out->x = x;
  out->y = y;
  out->z = FQ2_ONE;
  // The curve over Fp2 has more points than the pairing subgroup, and a point
  // outside it makes the pairing meaningless, so EIP-197 rejects it.
  g2 check;
  g2_mul(&check, out, BN_R);
  return g2_is_inf(&check);
}

// ---------------------------------------------------------------------------
// The optimal ate pairing
// ---------------------------------------------------------------------------

// 6t + 2 = 29793968203157093288, the ate loop count. It needs 65 bits, so the
// leading one is kept apart from the low 64.
#define BN_ATE_LO 0x9D797039BE763BA8ULL
#define BN_ATE_BITS 65
static inline int bn_ate_bit(int bit) {
  return bit == 64 ? 1 : (int)((BN_ATE_LO >> bit) & 1);
}

/**
 * The line through `a` and `b` (or the tangent at `a` when they are equal),
 * evaluated at the affine G1 point `(px, py)` and lifted into Fp12.
 *
 * The twist is D-type, so untwisting is `(x, y) -> (w^2 x, w^3 y)` and the
 * slope of the untwisted line is `w * slope`. Substituting into
 * `y_P - y_A - slope*(x_P - x_A)` and using `w^3 = v*w` gives
 *
 *   y_P  +  (-slope * x_P) * w  +  (slope * x_A - y_A) * v * w
 *
 * which is where the three terms below land. Writing them in any other
 * arrangement still satisfies `e(P,Q) * e(-P,Q) == 1`, so bilinearity across
 * two different multiples of `P` is the test that actually pins this down.
 */
static fq12_line g2_line(const fq2 ax, const fq2 ay, const fq2 bx, const fq2 by,
                         u256 px, u256 py, int tangent) {
  fq2 slope;
  if (tangent) {
    // 3x^2 / 2y
    fq2 num = fq2_sqr(ax);
    num = fq2_add(fq2_add(num, num), num);
    slope = fq2_mul(num, fq2_inv(fq2_add(ay, ay)));
  } else {
    slope = fq2_mul(fq2_sub(by, ay), fq2_inv(fq2_sub(bx, ax)));
  }
  return (fq12_line){(fq2){py, U256_ZERO},
                     fq2_mul_fq(fq2_neg(slope), px),
                     fq2_sub(fq2_mul(slope, ax), ay)};
}

/**
 * The Miller loop for `e(P, Q)`, with `P` affine in G1 and `Q` affine in G2.
 *
 * Points at infinity are handled by the caller: the pairing of anything with
 * infinity is one, so those terms are skipped entirely.
 */
static fq12 bn_miller(u256 px, u256 py, fq2 qx, fq2 qy) {
  fq12 f = FQ12_ONE;
  fq2 rx = qx, ry = qy;
  // The leading bit only seeds R = Q, so the loop starts one below it.
  for (int bit = BN_ATE_BITS - 2; bit >= 0; bit--) {
    // Double: accumulate the tangent line, then R = 2R.
    f = fq12_sqr(f);
    f = fq12_mul_line(f, g2_line(rx, ry, rx, ry, px, py, 1));
    {
      g2 rj = (g2){rx, ry, FQ2_ONE}, t;
      g2_double(&t, &rj);
      const fq2 zi = fq2_inv(t.z);
      const fq2 zi2 = fq2_sqr(zi);
      rx = fq2_mul(t.x, zi2);
      ry = fq2_mul(t.y, fq2_mul(zi2, zi));
    }
    if (bn_ate_bit(bit)) {
      f = fq12_mul_line(f, g2_line(rx, ry, qx, qy, px, py, 0));
      g2 rj = (g2){rx, ry, FQ2_ONE}, qj = (g2){qx, qy, FQ2_ONE}, t;
      g2_add(&t, &rj, &qj);
      const fq2 zi = fq2_inv(t.z);
      const fq2 zi2 = fq2_sqr(zi);
      rx = fq2_mul(t.x, zi2);
      ry = fq2_mul(t.y, fq2_mul(zi2, zi));
    }
  }
  // The two Frobenius corrections that make the ate pairing bilinear.
  const fq2 q1x = fq2_mul(fq2_conj(qx), bn_gamma[2]);
  const fq2 q1y = fq2_mul(fq2_conj(qy), bn_gamma[3]);
  const fq2 q2x = fq2_mul(fq2_conj(q1x), bn_gamma[2]);
  const fq2 q2y = fq2_neg(fq2_mul(fq2_conj(q1y), bn_gamma[3]));
  f = fq12_mul_line(f, g2_line(rx, ry, q1x, q1y, px, py, 0));
  {
    g2 rj = (g2){rx, ry, FQ2_ONE}, qj = (g2){q1x, q1y, FQ2_ONE}, t;
    g2_add(&t, &rj, &qj);
    const fq2 zi = fq2_inv(t.z);
    const fq2 zi2 = fq2_sqr(zi);
    rx = fq2_mul(t.x, zi2);
    ry = fq2_mul(t.y, fq2_mul(zi2, zi));
  }
  f = fq12_mul_line(f, g2_line(rx, ry, q2x, q2y, px, py, 0));
  return f;
}

/** The final exponentiation, `f^((p^12 - 1) / r)`. */
/** `a^u` for the curve parameter, inside the cyclotomic subgroup. */
static fq12 fq12_pow_u(fq12 a) {
  fq12 r = a;
  // Bit 62 is the top one and is consumed by the initialisation above. A
  // window would need a table, and at 63 bits its fifteen setup
  // multiplications cost about what the twenty-seven it saves are worth.
  for (int i = 61; i >= 0; i--) {
    r = fq12_cyclo_sqr(r);
    if ((BN_U >> i) & 1) r = fq12_mul(r, a);
  }
  return r;
}

/**
 * `f^((p^4 - p^2 + 1)/r)`, by the addition chain rather than the exponent.
 *
 * The exponent is 761 bits, and a windowed square-and-multiply over it is 761
 * cyclotomic squarings and about two hundred multiplications — which was 71%
 * of a pairing. It is not an arbitrary number, though: written in base `p` its
 * four digits are small polynomials in the curve parameter `u`,
 *
 *   d = 1 * p^3 + (6u^2 + 1) p^2 + (-36u^3 - 18u^2 - 12u + 1) p
 *       + (-36u^3 - 30u^2 - 18u - 2)
 *
 * so everything follows from `f^u`, `f^(u^2)` and `f^(u^3)` — three 63-bit
 * exponentiations — combined by Frobenius maps and a dozen multiplications.
 * The grouping below is Scott, Benger, Charlemagne, Perez and Kachisa's; the
 * chain was checked to reproduce `d` exactly, not a multiple of it, so this is
 * the same pairing value and not merely one that agrees on the check.
 *
 * Conjugation stands in for inversion throughout: after the easy part `f` is
 * in the cyclotomic subgroup, where the two coincide, and every term here
 * stays in it.
 */
static fq12 bn_hard_part(fq12 f) {
  const fq12 a = fq12_pow_u(f);
  const fq12 b = fq12_pow_u(a);
  const fq12 c = fq12_pow_u(b);

  const fq12 f1 = fq12_frobenius(f);
  const fq12 f2 = fq12_frobenius(f1);
  const fq12 f3 = fq12_frobenius(f2);

  const fq12 y0 = fq12_mul(fq12_mul(f1, f2), f3);
  const fq12 y1 = fq12_conj(f);
  const fq12 y2 = fq12_frobenius(fq12_frobenius(b));
  const fq12 y3 = fq12_conj(fq12_frobenius(a));
  const fq12 y4 = fq12_conj(fq12_mul(a, fq12_frobenius(b)));
  const fq12 y5 = fq12_conj(b);
  const fq12 y6 = fq12_conj(fq12_mul(c, fq12_frobenius(c)));

  fq12 t0 = fq12_cyclo_sqr(y6);
  t0 = fq12_mul(t0, y4);
  t0 = fq12_mul(t0, y5);
  fq12 t1 = fq12_mul(y3, y5);
  t1 = fq12_mul(t1, t0);
  t0 = fq12_mul(t0, y2);
  t1 = fq12_cyclo_sqr(t1);
  t1 = fq12_mul(t1, t0);
  t1 = fq12_cyclo_sqr(t1);
  t0 = fq12_mul(t1, y1);
  t1 = fq12_mul(t1, y0);
  t0 = fq12_cyclo_sqr(t0);
  return fq12_mul(t0, t1);
}

static fq12 bn_final_exp(fq12 f) {
  // Easy part: f^(p^6 - 1) then f^(p^2 + 1).
  fq12 t = fq12_mul(fq12_conj(f), fq12_inv(f));
  fq12 t2 = fq12_frobenius(fq12_frobenius(t));
  t = fq12_mul(t, t2);
  return bn_hard_part(t);
}

#endif // OX_EVM_BN254_H
