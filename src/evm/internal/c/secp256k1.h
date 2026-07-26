// secp256k1 public-key recovery, for the ecrecover precompile (0x01).
//
// Three things carry the cost of a recovery, and all three are specialised:
// the field multiplication folds on this prime's shape rather than dividing,
// inversion is Bernstein-Yang safegcd rather than Fermat's exponentiation, and
// the two scalar products share one doubling chain with a 4-bit window rather
// than running three bit-at-a-time ladders one after another. Together they
// take a recovery from about 1.4 ms to well under a tenth of that.
//
// Curve constants are derived at runtime from the prime rather than transcribed,
// which removes a whole class of typo.

#ifndef OX_EVM_SECP256K1_H
#define OX_EVM_SECP256K1_H

#include "keccak.h"
#include "safegcd.h"
#include "u256.h"

// p = 2^256 - 2^32 - 977
#define SECP_P                                                    \
  ((u256){{0xFFFFFFFEFFFFFC2FULL, 0xFFFFFFFFFFFFFFFFULL,          \
           0xFFFFFFFFFFFFFFFFULL, 0xFFFFFFFFFFFFFFFFULL}})
// The group order.
#define SECP_N                                                    \
  ((u256){{0xBFD25E8CD0364141ULL, 0xBAAEDCE6AF48A03BULL,          \
           0xFFFFFFFFFFFFFFFEULL, 0xFFFFFFFFFFFFFFFFULL}})
#define SECP_GX                                                   \
  ((u256){{0x59F2815B16F81798ULL, 0x029BFCDB2DCE28D9ULL,          \
           0x55A06295CE870B07ULL, 0x79BE667EF9DCBBACULL}})
#define SECP_GY                                                   \
  ((u256){{0x9C47D08FFB10D4B8ULL, 0xFD17B448A6855419ULL,          \
           0x5DA4FBFC0E1108A8ULL, 0x483ADA7726A3C465ULL}})

// Five limbs of 62 bits covers both of the moduli above, which is the width
// `safegcd.h` works in.
#define SG_SECP_LIMBS 5

// ---------------------------------------------------------------------------
// Field arithmetic modulo p
//
// p is a pseudo-Mersenne prime: 2^256 = 2^32 + 977 (mod p). So the top half of
// a 512-bit product folds into the bottom half by one multiplication by the
// 33-bit constant below, and two folds always suffice. That replaces the
// 512-by-256 Knuth division the generic `u256_mulmod` runs, which was costing
// about 90 ns where this costs single-digit ns.
// ---------------------------------------------------------------------------

#define SECP_C 0x1000003D1ULL // 2^256 - p

/**
 * `out = lo + hi * SECP_C`, returning the limb above `out[3]`.
 *
 * Each step's carry is bounded by `SECP_C` plus a couple of units, so it stays
 * far inside one limb and no second carry chain is needed.
 */
static inline uint64_t secp_fold(uint64_t out[4], const uint64_t lo[4],
                                 const uint64_t hi[4]) {
  uint64_t carry = 0;
  for (int i = 0; i < 4; i++) {
    uint64_t pl, ph;
    mul64(hi[i], SECP_C, &pl, &ph);
    uint64_t s = lo[i] + carry;
    uint64_t k = (s < carry);
    s += pl;
    k += (s < pl);
    out[i] = s;
    carry = ph + k;
  }
  return carry;
}

/** Reduces a 512-bit product modulo p. */
static inline u256 secp_reduce(const uint64_t t[8]) {
  uint64_t r[4];
  // First fold: at most 2^34 spills past limb 3.
  uint64_t carry = secp_fold(r, t, t + 4);
  // Second fold: carry * SECP_C is under 2^67, so it touches two limbs and can
  // spill at most one more bit.
  while (carry) {
    uint64_t pl, ph;
    mul64(carry, SECP_C, &pl, &ph);
    carry = 0;
    uint64_t s = r[0] + pl;
    uint64_t k = (s < pl);
    r[0] = s;
    s = r[1] + ph;
    uint64_t k2 = (s < ph);
    s += k;
    k2 += (s < k);
    r[1] = s;
    s = r[2] + k2;
    k = (s < k2);
    r[2] = s;
    s = r[3] + k;
    carry = (s < k);
    r[3] = s;
  }
  u256 v = {{r[0], r[1], r[2], r[3]}};
  // At most one subtraction: the folded value is under 2^256 and p is within
  // 2^32 + 977 of it.
  if (u256_cmp(v, SECP_P) >= 0) v = u256_sub(v, SECP_P);
  return v;
}

static inline u256 secp_mul(u256 a, u256 b) {
  uint64_t t[8];
  u256_mul_full(a, b, t);
  return secp_reduce(t);
}

/** `a + b mod m`, for `m > 2^255` so a single conditional subtraction suffices. */
static inline u256 fp_add(u256 a, u256 b, u256 m) {
  const u256 r = u256_add(a, b);
  // A wrap means the true sum exceeded 2^256, which is above `m`.
  const int carry = u256_cmp(r, a) < 0;
  if (carry || u256_cmp(r, m) >= 0) return u256_sub(r, m);
  return r;
}

static inline u256 fp_sub(u256 a, u256 b, u256 m) {
  if (u256_cmp(a, b) < 0) return u256_add(u256_sub(a, b), m);
  return u256_sub(a, b);
}

// `m` is always one of the two moduli, and the field one is overwhelmingly the
// common case: everything inside a scalar multiplication is mod p, and only the
// two scalar inversions are mod n.
static inline u256 fp_mul(u256 a, u256 b, u256 m) {
  if (u256_eq(m, SECP_P)) return secp_mul(a, b);
  return u256_mulmod(a, b, m);
}

static inline u256 fp_sqr(u256 a, u256 m) { return fp_mul(a, a, m); }

/** `a^e mod m`, square-and-multiply from the top bit. */
static u256 fp_pow(u256 a, u256 e, u256 m) {
  u256 result = U256_ONE;
  for (int bit = 255; bit >= 0; bit--) {
    result = fp_sqr(result, m);
    if ((e.l[bit / 64] >> (bit % 64)) & 1) result = fp_mul(result, a, m);
  }
  return result;
}

/**
 * `a^-1 mod m` for odd `m` and `a` already reduced, by Bernstein-Yang safegcd.
 *
 * Fermat's `a^(m-2)` needs 256 squarings and about 128 multiplications, and
 * the binary extended GCD that replaced it needs roughly 360 iterations of
 * shift-compare-subtract. safegcd folds 62 of those steps at a time into a
 * 2x2 matrix read off the low bits; see `safegcd.h`. It matters most for the
 * inverse modulo the group order, which has no fast reduction.
 *
 * Both moduli arrive here, so the 62-bit form and the inverse the reduction
 * needs are derived rather than tabulated. That is a few dozen operations
 * against the thousands the inversion itself costs.
 */
static u256 fp_inv(u256 a, u256 m) {
  if (u256_is_zero(a)) return U256_ZERO;
  sg62 sm, x;
  sg_from64(&sm, m.l, 4, SG_SECP_LIMBS);
  sg_from64(&x, a.l, 4, SG_SECP_LIMBS);
  sg_inv(SG_SECP_LIMBS, &x, sm.v, sg_modinv62((uint64_t)sm.v[0]));
  u256 r;
  sg_to64(r.l, 4, &x, SG_SECP_LIMBS);
  return r;
}

/** A point in Jacobian coordinates; `z == 0` is the point at infinity. */
typedef struct {
  u256 x, y, z;
} jpoint;

static inline int jp_is_inf(const jpoint *p) { return u256_is_zero(p->z); }

/** Doubling for a curve with `a == 0`, which secp256k1 is (`y^2 = x^3 + 7`). */
static void jp_double(jpoint *r, const jpoint *p) {
  const u256 m = SECP_P;
  if (jp_is_inf(p) || u256_is_zero(p->y)) {
    r->x = U256_ONE;
    r->y = U256_ONE;
    r->z = U256_ZERO;
    return;
  }
  const u256 A = fp_sqr(p->x, m);
  const u256 B = fp_sqr(p->y, m);
  const u256 C = fp_sqr(B, m);
  u256 D = fp_add(p->x, B, m);
  D = fp_sqr(D, m);
  D = fp_sub(D, A, m);
  D = fp_sub(D, C, m);
  D = fp_add(D, D, m); // D = 2*((X+B)^2 - A - C)
  const u256 E = fp_add(fp_add(A, A, m), A, m); // 3A
  const u256 F = fp_sqr(E, m);

  u256 x3 = fp_sub(F, fp_add(D, D, m), m);
  u256 c8 = fp_add(C, C, m);
  c8 = fp_add(c8, c8, m);
  c8 = fp_add(c8, c8, m); // 8C
  u256 y3 = fp_mul(E, fp_sub(D, x3, m), m);
  y3 = fp_sub(y3, c8, m);
  u256 z3 = fp_mul(p->y, p->z, m);
  z3 = fp_add(z3, z3, m);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void jp_add(jpoint *r, const jpoint *p, const jpoint *q) {
  const u256 m = SECP_P;
  if (jp_is_inf(p)) {
    *r = *q;
    return;
  }
  if (jp_is_inf(q)) {
    *r = *p;
    return;
  }
  const u256 z1z1 = fp_sqr(p->z, m);
  const u256 z2z2 = fp_sqr(q->z, m);
  const u256 u1 = fp_mul(p->x, z2z2, m);
  const u256 u2 = fp_mul(q->x, z1z1, m);
  const u256 s1 = fp_mul(fp_mul(p->y, z2z2, m), q->z, m);
  const u256 s2 = fp_mul(fp_mul(q->y, z1z1, m), p->z, m);

  const u256 h = fp_sub(u2, u1, m);
  const u256 rr = fp_sub(s2, s1, m);
  if (u256_is_zero(h)) {
    // Same x: either a doubling or a point plus its own negation.
    if (u256_is_zero(rr)) {
      jp_double(r, p);
      return;
    }
    r->x = U256_ONE;
    r->y = U256_ONE;
    r->z = U256_ZERO;
    return;
  }
  const u256 h2 = fp_add(h, h, m);
  const u256 i = fp_sqr(h2, m);
  const u256 j = fp_mul(h, i, m);
  const u256 r2 = fp_add(rr, rr, m);
  const u256 v = fp_mul(u1, i, m);

  u256 x3 = fp_sqr(r2, m);
  x3 = fp_sub(x3, j, m);
  x3 = fp_sub(x3, fp_add(v, v, m), m);
  u256 y3 = fp_mul(r2, fp_sub(v, x3, m), m);
  u256 s1j = fp_mul(s1, j, m);
  y3 = fp_sub(y3, fp_add(s1j, s1j, m), m);
  u256 z3 = fp_add(p->z, q->z, m);
  z3 = fp_sqr(z3, m);
  z3 = fp_sub(z3, z1z1, m);
  z3 = fp_sub(z3, z2z2, m);
  z3 = fp_mul(z3, h, m);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static inline void jp_set_inf(jpoint *p) {
  p->x = U256_ONE;
  p->y = U256_ONE;
  p->z = U256_ZERO;
}

/** `t[i] = i * p` for `i` in 1..15; `t[0]` is left as the point at infinity. */
static void jp_table(jpoint t[16], const jpoint *p) {
  jp_set_inf(&t[0]);
  t[1] = *p;
  jp_double(&t[2], p);
  for (int i = 3; i < 16; i++) jp_add(&t[i], &t[i - 1], p);
}

static inline int nibble(u256 k, int i) {
  return (int)((k.l[i / 16] >> ((i % 16) * 4)) & 0xf);
}

/**
 * `k1 * p1 + k2 * p2`, four bits of each scalar per step.
 *
 * Shamir's trick: the two products share one doubling chain instead of running
 * two of their own, and the 4-bit window turns a per-bit addition into one per
 * four bits. Against the bit-at-a-time double-and-add this replaces, and given
 * that ecrecover was running that three times over, it is about a quarter of
 * the point operations.
 */
static void jp_mul2(jpoint *out, const jpoint *p1, u256 k1, const jpoint *p2,
                    u256 k2) {
  jpoint t1[16], t2[16];
  jp_table(t1, p1);
  jp_table(t2, p2);

  jpoint acc;
  jp_set_inf(&acc);
  int started = 0;
  for (int i = 63; i >= 0; i--) {
    if (started)
      for (int d = 0; d < 4; d++) jp_double(&acc, &acc);
    const int n1 = nibble(k1, i), n2 = nibble(k2, i);
    if (n1) {
      if (started) {
        jp_add(&acc, &acc, &t1[n1]);
      } else {
        acc = t1[n1];
        started = 1;
      }
    }
    if (n2) {
      if (started) {
        jp_add(&acc, &acc, &t2[n2]);
      } else {
        acc = t2[n2];
        started = 1;
      }
    }
  }
  *out = acc;
}

/** Converts to affine coordinates. Returns 0 for the point at infinity. */
static int jp_affine(const jpoint *p, u256 *x, u256 *y) {
  const u256 m = SECP_P;
  if (jp_is_inf(p)) return 0;
  const u256 zinv = fp_inv(p->z, m);
  const u256 zinv2 = fp_sqr(zinv, m);
  *x = fp_mul(p->x, zinv2, m);
  *y = fp_mul(p->y, fp_mul(zinv2, zinv, m), m);
  return 1;
}

/**
 * Recovers the signer address from a 32-byte hash and a signature.
 *
 * `recovery` is 0 or 1. Returns 1 and writes 20 bytes to `out_address`, or 0
 * if the signature does not correspond to a curve point.
 */
static int ecrecover(const uint8_t hash[32], const u256 r, const u256 s,
                     int recovery, uint8_t *out_address) {
  const u256 p = SECP_P;
  const u256 n = SECP_N;
  if (u256_is_zero(r) || u256_is_zero(s)) return 0;
  if (u256_cmp(r, n) >= 0 || u256_cmp(s, n) >= 0) return 0;

  // Recover R from its x coordinate: y^2 = x^3 + 7.
  const u256 x3 = fp_mul(fp_sqr(r, p), r, p);
  const u256 y2 = fp_add(x3, u256_from_u64(7), p);
  // p = 3 mod 4, so the square root is y2^((p+1)/4).
  const u256 exp = u256_shr(u256_add(p, U256_ONE), 2);
  u256 y = fp_pow(y2, exp, p);
  if (!u256_eq(fp_sqr(y, p), y2)) return 0; // r is not on the curve
  // The recovery id selects the parity of y.
  if ((int)(y.l[0] & 1) != recovery) y = u256_sub(p, y);

  jpoint R;
  R.x = r;
  R.y = y;
  R.z = U256_ONE;

  u256 e = u256_from_be(hash);
  // The message scalar is reduced modulo the group order.
  if (u256_cmp(e, n) >= 0) e = u256_sub(e, n);

  jpoint G;
  G.x = SECP_GX;
  G.y = SECP_GY;
  G.z = U256_ONE;

  // Q = r^-1 * (s*R - e*G), rearranged as (-e/r)*G + (s/r)*R so that the two
  // products share one doubling chain. The direct reading needs three scalar
  // multiplications run one after another; this needs one.
  const u256 rinv = fp_inv(r, n);
  u256 u1 = u256_mulmod(e, rinv, n);
  if (!u256_is_zero(u1)) u1 = u256_sub(n, u1); // -e/r
  const u256 u2 = u256_mulmod(s, rinv, n);
  jpoint Q;
  jp_mul2(&Q, &G, u1, &R, u2);

  u256 qx, qy;
  if (!jp_affine(&Q, &qx, &qy)) return 0;

  uint8_t pub[64];
  u256_to_be(qx, pub);
  u256_to_be(qy, pub + 32);
  uint8_t digest[32];
  keccak256(pub, 64, digest);
  for (int i = 0; i < 20; i++) out_address[i] = digest[12 + i];
  return 1;
}

#endif // OX_EVM_SECP256K1_H
