// BLS12-381 arithmetic for the EIP-2537 precompiles and EIP-4844's point
// evaluation.
//
// The field is 381 bits, so unlike bn254 this cannot ride on `u256`. It gets a
// six-limb type with Montgomery multiplication — the pairing does hundreds of
// thousands of field multiplications, and a generic reduction per multiply
// would put a single pairing well into the hundreds of milliseconds.
// Inversion is still Fermat, which is fine because the Miller loop needs only a
// couple per iteration.
//
// The tower matches the standard one:
//
//   Fp2  = Fp[u]  / (u^2 + 1)
//   Fp6  = Fp2[v] / (v^3 - xi),  xi = 1 + u
//   Fp12 = Fp6[w] / (w^2 - v)
//
// The curve is y^2 = x^3 + 4 over Fp, and its D-twist y^2 = x^3 + 4(1 + u) over
// Fp2. EIP-2537 encodes an Fp element as 64 bytes — 16 zero bytes then 48
// big-endian bytes — and an Fp2 element as its real part first, the opposite of
// EIP-197's convention for bn254.

#ifndef OX_EVM_BLS12381_H
#define OX_EVM_BLS12381_H

#include "safegcd.h"
#include "u256.h" // for mul64

#define BFP_LIMBS 6

typedef struct {
  uint64_t l[BFP_LIMBS]; // little-endian limbs, in Montgomery form
} bfp;

// p = (z-1)^2 (z^4 - z^2 + 1)/3 + z for z = -0xd201000000010000
static const uint64_t BLS_P[BFP_LIMBS] = {
    0xB9FEFFFFFFFFAAABULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL,
    0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL};
// 2^384 mod p — the Montgomery representation of one.
static const uint64_t BLS_R[BFP_LIMBS] = {
    0x760900000002FFFDULL, 0xEBF4000BC40C0002ULL, 0x5F48985753C758BAULL,
    0x77CE585370525745ULL, 0x5C071A97A256EC6DULL, 0x15F65EC3FA80E493ULL};
// 2^768 mod p, for converting into Montgomery form.
static const uint64_t BLS_R2[BFP_LIMBS] = {
    0xF4DF1F341C341746ULL, 0x0A76E6A609D104F1ULL, 0x8DE5476C4C95B6D5ULL,
    0x67EB88A9939D83C0ULL, 0x9A793E85B519952DULL, 0x11988FE592CAE3AAULL};
// -p^-1 mod 2^64
#define BLS_INV 0x89F3FFFCFFFCFFFDULL

// The same prime as seven limbs of 62 bits, and its inverse mod 2^62, which is
// what `safegcd.h` works in.
#define SG_BLS_LIMBS 7
static const int64_t SG_BLS_P[SG_BLS_LIMBS] = {
    0x39FEFFFFFFFFAAABLL, 0x3AAFFFFAC54FFFFELL, 0x330D2A0F6B0F6241LL,
    0x1DD2E13CE144AFD9LL, 0x1BA7B6434BACD764LL, 0x0447A8E5FF9A692CLL,
    0x00000000000001A0LL};
#define SG_BLS_INV62 0x360C000300030003ULL

// The order of both groups.
static const uint64_t BLS_ORDER[4] = {
    0xFFFFFFFF00000001ULL, 0x53BDA402FFFE5BFEULL, 0x3339D80809A1D805ULL,
    0x73EDA753299D7D48ULL};

#define BFP_ZERO ((bfp){{0, 0, 0, 0, 0, 0}})

static inline int bfp_is_zero(bfp a) {
  uint64_t acc = 0;
  for (int i = 0; i < BFP_LIMBS; i++) acc |= a.l[i];
  return acc == 0;
}

static inline int bfp_eq(bfp a, bfp b) {
  for (int i = 0; i < BFP_LIMBS; i++)
    if (a.l[i] != b.l[i]) return 0;
  return 1;
}

/** Compares against the modulus; 1 when `a >= p`. */
static inline int bfp_ge_p(const uint64_t *a) {
  for (int i = BFP_LIMBS - 1; i >= 0; i--) {
    if (a[i] > BLS_P[i]) return 1;
    if (a[i] < BLS_P[i]) return 0;
  }
  return 1;
}

static inline void bfp_sub_p(uint64_t *a) {
  uint64_t borrow = 0;
  for (int i = 0; i < BFP_LIMBS; i++) {
    const uint64_t d = a[i] - BLS_P[i] - borrow;
    borrow = (a[i] < BLS_P[i] + borrow) ||
             (borrow && BLS_P[i] == 0xFFFFFFFFFFFFFFFFULL);
    a[i] = d;
  }
}

static inline bfp bfp_add(bfp a, bfp b) {
  bfp r;
  uint64_t carry = 0;
  for (int i = 0; i < BFP_LIMBS; i++) {
    const uint64_t s = a.l[i] + b.l[i];
    const uint64_t c1 = s < a.l[i];
    const uint64_t s2 = s + carry;
    carry = c1 | (s2 < s);
    r.l[i] = s2;
  }
  // p is below 2^381, so the sum of two reduced values never exceeds 2^382 and
  // a single conditional subtraction suffices.
  if (carry || bfp_ge_p(r.l)) bfp_sub_p(r.l);
  return r;
}

static inline bfp bfp_sub(bfp a, bfp b) {
  bfp r;
  uint64_t borrow = 0;
  for (int i = 0; i < BFP_LIMBS; i++) {
    const uint64_t d = a.l[i] - b.l[i] - borrow;
    borrow = (a.l[i] < b.l[i] + borrow) ||
             (borrow && b.l[i] == 0xFFFFFFFFFFFFFFFFULL);
    r.l[i] = d;
  }
  if (borrow) {
    uint64_t carry = 0;
    for (int i = 0; i < BFP_LIMBS; i++) {
      const uint64_t s = r.l[i] + BLS_P[i];
      const uint64_t c1 = s < r.l[i];
      const uint64_t s2 = s + carry;
      carry = c1 | (s2 < s);
      r.l[i] = s2;
    }
  }
  return r;
}

static inline bfp bfp_neg(bfp a) { return bfp_is_zero(a) ? a : bfp_sub(BFP_ZERO, a); }

/**
 * Montgomery multiplication, CIOS.
 *
 * Computes `a * b * R^-1 mod p`, so values held in Montgomery form multiply
 * without a division anywhere.
 */
static bfp bfp_mul(bfp a, bfp b) {
  uint64_t t[BFP_LIMBS + 2] = {0};
  for (int i = 0; i < BFP_LIMBS; i++) {
    uint64_t carry = 0;
    for (int j = 0; j < BFP_LIMBS; j++) {
      uint64_t lo, hi;
      mul64(a.l[j], b.l[i], &lo, &hi);
      uint64_t s = t[j] + lo;
      hi += s < t[j];
      s += carry;
      hi += s < carry;
      t[j] = s;
      carry = hi;
    }
    uint64_t s = t[BFP_LIMBS] + carry;
    t[BFP_LIMBS + 1] += s < t[BFP_LIMBS];
    t[BFP_LIMBS] = s;

    // One reduction step: cancel the low limb by adding a multiple of p.
    const uint64_t m = t[0] * BLS_INV;
    uint64_t lo, hi;
    mul64(m, BLS_P[0], &lo, &hi);
    uint64_t carry2 = hi + ((t[0] + lo) < t[0]);
    for (int j = 1; j < BFP_LIMBS; j++) {
      mul64(m, BLS_P[j], &lo, &hi);
      uint64_t s2 = t[j] + lo;
      hi += s2 < t[j];
      s2 += carry2;
      hi += s2 < carry2;
      t[j - 1] = s2;
      carry2 = hi;
    }
    s = t[BFP_LIMBS] + carry2;
    t[BFP_LIMBS - 1] = s;
    t[BFP_LIMBS] = t[BFP_LIMBS + 1] + (s < carry2);
    t[BFP_LIMBS + 1] = 0;
  }
  bfp r;
  for (int i = 0; i < BFP_LIMBS; i++) r.l[i] = t[i];
  if (t[BFP_LIMBS] || bfp_ge_p(r.l)) bfp_sub_p(r.l);
  return r;
}

static inline bfp bfp_sqr(bfp a) { return bfp_mul(a, a); }

/** Converts a plain integer into Montgomery form. */
static inline bfp bfp_to_mont(const uint64_t *raw) {
  bfp a, r2;
  for (int i = 0; i < BFP_LIMBS; i++) {
    a.l[i] = raw[i];
    r2.l[i] = BLS_R2[i];
  }
  return bfp_mul(a, r2);
}

/** Converts out of Montgomery form, into plain limbs. */
static inline void bfp_from_mont(bfp a, uint64_t *out) {
  bfp one = BFP_ZERO;
  one.l[0] = 1;
  const bfp r = bfp_mul(a, one);
  for (int i = 0; i < BFP_LIMBS; i++) out[i] = r.l[i];
}

static inline bfp bfp_one(void) {
  bfp r;
  for (int i = 0; i < BFP_LIMBS; i++) r.l[i] = BLS_R[i];
  return r;
}

/**
 * `R^3 mod p`, which converts the extended GCD's output back into Montgomery
 * form. Derived from `R^2` rather than transcribed.
 */
static bfp bls_r3(void) {
  static bfp cached;
  static int ready;
  if (!ready) {
    bfp r2;
    for (int i = 0; i < BFP_LIMBS; i++) r2.l[i] = BLS_R2[i];
    cached = bfp_mul(r2, r2); // R^2 * R^2 / R = R^3
    ready = 1;
  }
  return cached;
}

/** `a^e` for an exponent given as `n` little-endian limbs. */
static bfp bfp_pow(bfp a, const uint64_t *e, int n) {
  bfp r = bfp_one();
  int started = 0;
  for (int i = n - 1; i >= 0; i--)
    for (int bit = 63; bit >= 0; bit--) {
      if (started) r = bfp_sqr(r);
      if ((e[i] >> bit) & 1) {
        r = started ? bfp_mul(r, a) : a;
        started = 1;
      }
    }
  return r;
}

/** `a / 2`, adding the modulus first when `a` is odd so the shift is exact. */
static inline bfp bfp_half(bfp a) {
  bfp r = a;
  if (r.l[0] & 1) {
    uint64_t carry = 0;
    for (int i = 0; i < BFP_LIMBS; i++) {
      const uint64_t s = r.l[i] + BLS_P[i];
      const uint64_t c1 = s < r.l[i];
      const uint64_t s2 = s + carry;
      carry = c1 | (s2 < s);
      r.l[i] = s2;
    }
    // The sum needs 382 bits; carry holds the bit the shift below restores.
    for (int i = 0; i < BFP_LIMBS - 1; i++)
      r.l[i] = (r.l[i] >> 1) | (r.l[i + 1] << 63);
    r.l[BFP_LIMBS - 1] = (r.l[BFP_LIMBS - 1] >> 1) | (carry << 63);
    return r;
  }
  for (int i = 0; i < BFP_LIMBS - 1; i++)
    r.l[i] = (r.l[i] >> 1) | (r.l[i + 1] << 63);
  r.l[BFP_LIMBS - 1] >>= 1;
  return r;
}

/**
 * `a^-1 mod p`, by Bernstein-Yang safegcd.
 *
 * Fermat's `a^(p-2)` over a 381-bit prime is 381 squarings and about 190
 * multiplications, and the binary extended GCD that replaced it is around 540
 * iterations of shift-compare-subtract over the full width. safegcd batches 62
 * of those steps into a 2x2 matrix built from the low bits alone, so a dozen
 * passes over the width finish it. See `safegcd.h`; measured 5.6x against the
 * binary GCD over the same inputs.
 *
 * The GCD works on the integer it is given, so on `aR` it returns `a^-1 R^-1`;
 * multiplying by `R^3` in Montgomery form lands on `a^-1 R`.
 */
static bfp bfp_inv(bfp a) {
  if (bfp_is_zero(a)) return BFP_ZERO;
  sg62 x;
  sg_from64(&x, a.l, BFP_LIMBS, SG_BLS_LIMBS);
  sg_inv(SG_BLS_LIMBS, &x, SG_BLS_P, SG_BLS_INV62);
  bfp r;
  sg_to64(r.l, BFP_LIMBS, &x, SG_BLS_LIMBS);
  return bfp_mul(r, bls_r3());
}

// ---------------------------------------------------------------------------
// Fp2 = Fp[u] / (u^2 + 1)
// ---------------------------------------------------------------------------

typedef struct {
  bfp c0, c1;
} fp2;

#define FP2_ZERO ((fp2){BFP_ZERO, BFP_ZERO})

static inline fp2 fp2_one(void) { return (fp2){bfp_one(), BFP_ZERO}; }
/** Builds an Fp2 from a pair of plain, non-Montgomery limb arrays. */
static inline fp2 fp2_from_raw(const uint64_t c[2][BFP_LIMBS]) {
  return (fp2){bfp_to_mont(c[0]), bfp_to_mont(c[1])};
}
static inline int fp2_is_zero(fp2 a) {
  return bfp_is_zero(a.c0) && bfp_is_zero(a.c1);
}
static inline int fp2_eq(fp2 a, fp2 b) {
  return bfp_eq(a.c0, b.c0) && bfp_eq(a.c1, b.c1);
}
static inline fp2 fp2_add(fp2 a, fp2 b) {
  return (fp2){bfp_add(a.c0, b.c0), bfp_add(a.c1, b.c1)};
}
static inline fp2 fp2_sub(fp2 a, fp2 b) {
  return (fp2){bfp_sub(a.c0, b.c0), bfp_sub(a.c1, b.c1)};
}
static inline fp2 fp2_neg(fp2 a) { return (fp2){bfp_neg(a.c0), bfp_neg(a.c1)}; }
static inline fp2 fp2_conj(fp2 a) { return (fp2){a.c0, bfp_neg(a.c1)}; }

static inline fp2 fp2_mul(fp2 a, fp2 b) {
  const bfp v0 = bfp_mul(a.c0, b.c0);
  const bfp v1 = bfp_mul(a.c1, b.c1);
  const bfp mid = bfp_mul(bfp_add(a.c0, a.c1), bfp_add(b.c0, b.c1));
  return (fp2){bfp_sub(v0, v1), bfp_sub(bfp_sub(mid, v0), v1)};
}

static inline fp2 fp2_sqr(fp2 a) {
  const bfp t0 = bfp_mul(bfp_add(a.c0, a.c1), bfp_sub(a.c0, a.c1));
  const bfp t1 = bfp_mul(a.c0, a.c1);
  return (fp2){t0, bfp_add(t1, t1)};
}

static inline fp2 fp2_mul_fp(fp2 a, bfp b) {
  return (fp2){bfp_mul(a.c0, b), bfp_mul(a.c1, b)};
}

static inline fp2 fp2_inv(fp2 a) {
  const bfp norm = bfp_add(bfp_sqr(a.c0), bfp_sqr(a.c1));
  const bfp ninv = bfp_inv(norm);
  return (fp2){bfp_mul(a.c0, ninv), bfp_neg(bfp_mul(a.c1, ninv))};
}

/** Multiplication by xi = 1 + u. */
static inline fp2 fp2_mul_xi(fp2 a) {
  // (c0 + c1 u)(1 + u) = (c0 - c1) + (c0 + c1) u
  return (fp2){bfp_sub(a.c0, a.c1), bfp_add(a.c0, a.c1)};
}

// ---------------------------------------------------------------------------
// Fp6 = Fp2[v] / (v^3 - xi)
// ---------------------------------------------------------------------------

typedef struct {
  fp2 c0, c1, c2;
} fp6;

#define FP6_ZERO ((fp6){FP2_ZERO, FP2_ZERO, FP2_ZERO})

static inline fp6 fp6_one(void) { return (fp6){fp2_one(), FP2_ZERO, FP2_ZERO}; }
static inline int fp6_is_zero(fp6 a) {
  return fp2_is_zero(a.c0) && fp2_is_zero(a.c1) && fp2_is_zero(a.c2);
}
static inline int fp6_eq(fp6 a, fp6 b) {
  return fp2_eq(a.c0, b.c0) && fp2_eq(a.c1, b.c1) && fp2_eq(a.c2, b.c2);
}
static inline fp6 fp6_add(fp6 a, fp6 b) {
  return (fp6){fp2_add(a.c0, b.c0), fp2_add(a.c1, b.c1), fp2_add(a.c2, b.c2)};
}
static inline fp6 fp6_sub(fp6 a, fp6 b) {
  return (fp6){fp2_sub(a.c0, b.c0), fp2_sub(a.c1, b.c1), fp2_sub(a.c2, b.c2)};
}
static inline fp6 fp6_neg(fp6 a) {
  return (fp6){fp2_neg(a.c0), fp2_neg(a.c1), fp2_neg(a.c2)};
}

static fp6 fp6_mul(fp6 a, fp6 b) {
  const fp2 t0 = fp2_mul(a.c0, b.c0);
  const fp2 t1 = fp2_mul(a.c1, b.c1);
  const fp2 t2 = fp2_mul(a.c2, b.c2);
  fp2 s = fp2_mul(fp2_add(a.c1, a.c2), fp2_add(b.c1, b.c2));
  const fp2 c0 = fp2_add(t0, fp2_mul_xi(fp2_sub(fp2_sub(s, t1), t2)));
  s = fp2_mul(fp2_add(a.c0, a.c1), fp2_add(b.c0, b.c1));
  const fp2 c1 = fp2_add(fp2_sub(fp2_sub(s, t0), t1), fp2_mul_xi(t2));
  s = fp2_mul(fp2_add(a.c0, a.c2), fp2_add(b.c0, b.c2));
  const fp2 c2 = fp2_add(fp2_sub(fp2_sub(s, t0), t2), t1);
  return (fp6){c0, c1, c2};
}

static inline fp6 fp6_sqr(fp6 a) { return fp6_mul(a, a); }

static inline fp6 fp6_mul_v(fp6 a) {
  return (fp6){fp2_mul_xi(a.c2), a.c0, a.c1};
}

static fp6 fp6_inv(fp6 a) {
  const fp2 t0 = fp2_sub(fp2_sqr(a.c0), fp2_mul_xi(fp2_mul(a.c1, a.c2)));
  const fp2 t1 = fp2_sub(fp2_mul_xi(fp2_sqr(a.c2)), fp2_mul(a.c0, a.c1));
  const fp2 t2 = fp2_sub(fp2_sqr(a.c1), fp2_mul(a.c0, a.c2));
  fp2 d = fp2_mul(a.c0, t0);
  d = fp2_add(d, fp2_mul_xi(fp2_mul(a.c2, t1)));
  d = fp2_add(d, fp2_mul_xi(fp2_mul(a.c1, t2)));
  const fp2 di = fp2_inv(d);
  return (fp6){fp2_mul(t0, di), fp2_mul(t1, di), fp2_mul(t2, di)};
}

// ---------------------------------------------------------------------------
// Fp12 = Fp6[w] / (w^2 - v)
// ---------------------------------------------------------------------------

typedef struct {
  fp6 c0, c1;
} fp12;

static inline fp12 fp12_one(void) { return (fp12){fp6_one(), FP6_ZERO}; }
static inline int fp12_is_one(fp12 a) {
  return fp6_eq(a.c0, fp6_one()) && fp6_is_zero(a.c1);
}
static inline fp12 fp12_conj(fp12 a) { return (fp12){a.c0, fp6_neg(a.c1)}; }

static fp12 fp12_mul(fp12 a, fp12 b) {
  const fp6 t0 = fp6_mul(a.c0, b.c0);
  const fp6 t1 = fp6_mul(a.c1, b.c1);
  const fp6 c0 = fp6_add(t0, fp6_mul_v(t1));
  fp6 c1 = fp6_mul(fp6_add(a.c0, a.c1), fp6_add(b.c0, b.c1));
  c1 = fp6_sub(fp6_sub(c1, t0), t1);
  return (fp12){c0, c1};
}

/** `a * (b, 0, 0)`. */
static inline fp6 fp6_mul_fp2(fp6 a, fp2 b) {
  return (fp6){fp2_mul(a.c0, b), fp2_mul(a.c1, b), fp2_mul(a.c2, b)};
}

/**
 * `a * (0, b1, b2)`, in five multiplications rather than the general six.
 *
 * `a1*b2 + a2*b1` comes out of one product against a sum, and `a0*b2` out of
 * another against a term already computed.
 */
static fp6 fp6_mul_12(fp6 a, fp2 b1, fp2 b2) {
  const fp2 v1 = fp2_mul(a.c1, b1);
  const fp2 v2 = fp2_mul(a.c2, b2);
  const fp2 cross =
      fp2_sub(fp2_sub(fp2_mul(fp2_add(a.c1, a.c2), fp2_add(b1, b2)), v1), v2);
  const fp2 a0b1 = fp2_mul(a.c0, b1);
  const fp2 a0b2 = fp2_sub(fp2_mul(fp2_add(a.c0, a.c2), b2), v2);
  return (fp6){fp2_mul_xi(cross), fp2_add(a0b1, fp2_mul_xi(v2)),
               fp2_add(a0b2, v1)};
}

/** The three non-zero coefficients a line evaluation produces. */
typedef struct {
  fp2 l0, l4, l5;
} fp12_line;

/**
 * `a * line`, where `line` is `(l0, 0, 0) + (0, l4, l5) w`.
 *
 * A line evaluation fills three of an Fp12's six Fp2 coefficients and the
 * Miller loop multiplies by one every iteration, so the general product runs
 * eighteen Fp2 multiplications where fourteen suffice. Fewer than bn254's
 * thirteen because this twist puts the two G2 terms at `v` and `v^2`, so the
 * Karatsuba middle sees a full Fp6 rather than a sparse one; the additions it
 * skips are worth more than the one multiplication it does not.
 */
static fp12 fp12_mul_line(fp12 a, fp12_line b) {
  const fp6 t0 = fp6_mul_fp2(a.c0, b.l0);
  const fp6 t1 = fp6_mul_12(a.c1, b.l4, b.l5);
  const fp6 c0 = fp6_add(t0, fp6_mul_v(t1));
  fp6 c1 = fp6_mul(fp6_add(a.c0, a.c1), (fp6){b.l0, b.l4, b.l5});
  c1 = fp6_sub(fp6_sub(c1, t0), t1);
  return (fp12){c0, c1};
}

/**
 * Squaring in Fp12, as a complex squaring over Fp6: two Fp6 products where the
 * general multiplication needs three.
 */
static fp12 fp12_sqr(fp12 a) {
  const fp6 t = fp6_mul(a.c0, a.c1);
  const fp6 c0 = fp6_sub(
      fp6_sub(fp6_mul(fp6_add(a.c0, a.c1), fp6_add(a.c0, fp6_mul_v(a.c1))), t),
      fp6_mul_v(t));
  return (fp12){c0, fp6_add(t, t)};
}

/**
 * Squaring restricted to the cyclotomic subgroup, after Granger and Scott.
 *
 * Once the easy part of the final exponentiation has run, the element
 * satisfies `f^(p^6+1) = 1`, and on that subgroup the twelve Fp2 coefficients
 * regroup into three Fp4 squarings — six Fp2 multiplications against the
 * eighteen a general Fp12 squaring costs. The hard part here is a 1280-bit
 * exponent, so almost all of it is squaring.
 *
 * The coefficients are read in `w`-power order: with `w^2 = v`, the Fp6 pair
 * `(c0, c1)` interleaves as `c0.c0, c1.c0, c0.c1, c1.c1, c0.c2, c1.c2`.
 *
 * Only valid on the subgroup — `fp12_sqr` is the one for anywhere else.
 */
static fp12 fp12_cyclo_sqr(fp12 a) {
  fp2 z0 = a.c0.c0, z4 = a.c0.c1, z3 = a.c0.c2;
  fp2 z2 = a.c1.c0, z1 = a.c1.c1, z5 = a.c1.c2;

  fp2 tmp = fp2_mul(z0, z1);
  const fp2 t0 = fp2_sub(
      fp2_sub(fp2_mul(fp2_add(z0, z1), fp2_add(z0, fp2_mul_xi(z1))), tmp),
      fp2_mul_xi(tmp));
  const fp2 t1 = fp2_add(tmp, tmp);

  tmp = fp2_mul(z2, z3);
  const fp2 t2 = fp2_sub(
      fp2_sub(fp2_mul(fp2_add(z2, z3), fp2_add(z2, fp2_mul_xi(z3))), tmp),
      fp2_mul_xi(tmp));
  const fp2 t3 = fp2_add(tmp, tmp);

  tmp = fp2_mul(z4, z5);
  const fp2 t4 = fp2_sub(
      fp2_sub(fp2_mul(fp2_add(z4, z5), fp2_add(z4, fp2_mul_xi(z5))), tmp),
      fp2_mul_xi(tmp));
  const fp2 t5 = fp2_add(tmp, tmp);

  z0 = fp2_sub(t0, z0);
  z0 = fp2_add(z0, z0);
  z0 = fp2_add(z0, t0);
  z1 = fp2_add(t1, z1);
  z1 = fp2_add(z1, z1);
  z1 = fp2_add(z1, t1);

  tmp = fp2_mul_xi(t5);
  z2 = fp2_add(tmp, z2);
  z2 = fp2_add(z2, z2);
  z2 = fp2_add(z2, tmp);
  z3 = fp2_sub(t4, z3);
  z3 = fp2_add(z3, z3);
  z3 = fp2_add(z3, t4);

  z4 = fp2_sub(t2, z4);
  z4 = fp2_add(z4, z4);
  z4 = fp2_add(z4, t2);
  z5 = fp2_add(t3, z5);
  z5 = fp2_add(z5, z5);
  z5 = fp2_add(z5, t3);

  return (fp12){{z0, z4, z3}, {z2, z1, z5}};
}

static fp12 fp12_inv(fp12 a) {
  const fp6 d = fp6_sub(fp6_sqr(a.c0), fp6_mul_v(fp6_sqr(a.c1)));
  const fp6 di = fp6_inv(d);
  return (fp12){fp6_mul(a.c0, di), fp6_neg(fp6_mul(a.c1, di))};
}

/**
 * The p-power Frobenius.
 *
 * `bls_gamma[i]` is `xi^(i*(p-1)/6)`, derived at runtime by {@link bls_init}
 * rather than transcribed. `v = w^2` is why the powers run 2j + i.
 */
static fp2 bls_gamma[6];
static int bls_ready = 0;

static fp2 fp2_pow_limbs(fp2 a, const uint64_t *e, int n) {
  fp2 r = fp2_one();
  int started = 0;
  for (int i = n - 1; i >= 0; i--)
    for (int bit = 63; bit >= 0; bit--) {
      if (started) r = fp2_sqr(r);
      if ((e[i] >> bit) & 1) {
        r = started ? fp2_mul(r, a) : a;
        started = 1;
      }
    }
  return r;
}

// (p - 1) / 6, the exponent that produces the Frobenius constants from xi.
static const uint64_t BLS_P_MINUS_1_OVER_6[BFP_LIMBS] = {
    0x49AA7FFFFFFFF1C7ULL, 0x051CAAAA72E35555ULL, 0xE688231AD3C82906ULL,
    0xE613E1EB7DEB831FULL, 0x0C849BF3B5E1F223ULL, 0x045582FC5EEAA66FULL};

/** Derives the Frobenius constants. Idempotent; called before any pairing. */
static void bls_init(void) {
  if (bls_ready) return;
  const fp2 xi = (fp2){bfp_one(), bfp_one()};
  bls_gamma[0] = fp2_one();
  bls_gamma[1] = fp2_pow_limbs(xi, BLS_P_MINUS_1_OVER_6, BFP_LIMBS);
  for (int i = 2; i < 6; i++)
    bls_gamma[i] = fp2_mul(bls_gamma[i - 1], bls_gamma[1]);
  bls_ready = 1;
}

static fp12 fp12_frobenius(fp12 a) {
  fp6 c0, c1;
  c0.c0 = fp2_conj(a.c0.c0);
  c0.c1 = fp2_mul(fp2_conj(a.c0.c1), bls_gamma[2]);
  c0.c2 = fp2_mul(fp2_conj(a.c0.c2), bls_gamma[4]);
  c1.c0 = fp2_mul(fp2_conj(a.c1.c0), bls_gamma[1]);
  c1.c1 = fp2_mul(fp2_conj(a.c1.c1), bls_gamma[3]);
  c1.c2 = fp2_mul(fp2_conj(a.c1.c2), bls_gamma[5]);
  return (fp12){c0, c1};
}

/** Division by xi = 1 + u. Its norm is 2, so `1/xi = (1 - u)/2`. */
static inline fp2 fp2_div_xi(fp2 a) {
  const bfp c0 = bfp_add(a.c0, a.c1);
  const bfp c1 = bfp_sub(a.c1, a.c0);
  return (fp2){bfp_half(c0), bfp_half(c1)};
}

// ---------------------------------------------------------------------------
// G1: y^2 = x^3 + 4 over Fp, in Jacobian coordinates
// ---------------------------------------------------------------------------

typedef struct {
  bfp x, y, z;
} bg1;

static inline bg1 bg1_inf(void) {
  return (bg1){bfp_one(), bfp_one(), BFP_ZERO};
}
static inline int bg1_is_inf(const bg1 *p) { return bfp_is_zero(p->z); }

static void bg1_double(bg1 *r, const bg1 *p) {
  if (bg1_is_inf(p) || bfp_is_zero(p->y)) {
    *r = bg1_inf();
    return;
  }
  const bfp A = bfp_sqr(p->x);
  const bfp B = bfp_sqr(p->y);
  const bfp C = bfp_sqr(B);
  bfp D = bfp_sqr(bfp_add(p->x, B));
  D = bfp_sub(D, A);
  D = bfp_sub(D, C);
  D = bfp_add(D, D);
  const bfp E = bfp_add(bfp_add(A, A), A);
  const bfp F = bfp_sqr(E);
  const bfp x3 = bfp_sub(F, bfp_add(D, D));
  bfp c8 = bfp_add(C, C);
  c8 = bfp_add(c8, c8);
  c8 = bfp_add(c8, c8);
  bfp y3 = bfp_mul(E, bfp_sub(D, x3));
  y3 = bfp_sub(y3, c8);
  bfp z3 = bfp_mul(p->y, p->z);
  z3 = bfp_add(z3, z3);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void bg1_add(bg1 *r, const bg1 *p, const bg1 *q) {
  if (bg1_is_inf(p)) {
    *r = *q;
    return;
  }
  if (bg1_is_inf(q)) {
    *r = *p;
    return;
  }
  // Both affine is the common case — it is what the add precompiles hand us,
  // and what the first steps of a scalar multiplication's table are. The
  // general formula squares and multiplies by two ones to discover that;
  // mmadd-2007-bl is four multiplications and two squarings against eleven
  // and five.
  if (bfp_eq(p->z, bfp_one()) && bfp_eq(q->z, bfp_one())) {
    const bfp h = bfp_sub(q->x, p->x);
    if (bfp_is_zero(h)) {
      if (bfp_eq(p->y, q->y)) {
        bg1_double(r, p);
        return;
      }
      *r = bg1_inf();
      return;
    }
    const bfp hh = bfp_sqr(h);
    bfp i = bfp_add(hh, hh);
    i = bfp_add(i, i);
    const bfp j = bfp_mul(h, i);
    const bfp rr = bfp_add(bfp_sub(q->y, p->y), bfp_sub(q->y, p->y));
    const bfp v = bfp_mul(p->x, i);
    bfp x3 = bfp_sub(bfp_sub(bfp_sqr(rr), j), bfp_add(v, v));
    bfp y1j = bfp_mul(p->y, j);
    y1j = bfp_add(y1j, y1j);
    r->x = x3;
    r->y = bfp_sub(bfp_mul(rr, bfp_sub(v, x3)), y1j);
    r->z = bfp_add(h, h);
    return;
  }
  const bfp z1z1 = bfp_sqr(p->z);
  const bfp z2z2 = bfp_sqr(q->z);
  const bfp u1 = bfp_mul(p->x, z2z2);
  const bfp u2 = bfp_mul(q->x, z1z1);
  const bfp s1 = bfp_mul(bfp_mul(p->y, z2z2), q->z);
  const bfp s2 = bfp_mul(bfp_mul(q->y, z1z1), p->z);
  const bfp h = bfp_sub(u2, u1);
  const bfp rr = bfp_sub(s2, s1);
  if (bfp_is_zero(h)) {
    if (bfp_is_zero(rr)) {
      bg1_double(r, p);
      return;
    }
    *r = bg1_inf();
    return;
  }
  const bfp h2 = bfp_add(h, h);
  const bfp i = bfp_sqr(h2);
  const bfp j = bfp_mul(h, i);
  const bfp r2 = bfp_add(rr, rr);
  const bfp v = bfp_mul(u1, i);
  bfp x3 = bfp_sqr(r2);
  x3 = bfp_sub(x3, j);
  x3 = bfp_sub(x3, bfp_add(v, v));
  bfp y3 = bfp_mul(r2, bfp_sub(v, x3));
  const bfp s1j = bfp_mul(s1, j);
  y3 = bfp_sub(y3, bfp_add(s1j, s1j));
  bfp z3 = bfp_sqr(bfp_add(p->z, q->z));
  z3 = bfp_sub(z3, z1z1);
  z3 = bfp_sub(z3, z2z2);
  z3 = bfp_mul(z3, h);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

/**
 * `k * p`, four bits of the scalar at a time.
 *
 * The window turns an addition every bit into one every four, for a table of
 * fifteen multiples. Both multiplications an MSM point pays go through here —
 * the scalar itself, and the subgroup check every decode runs — so it is the
 * hot path of the MSM precompiles.
 */
static void bg1_mul(bg1 *out, const bg1 *p, const uint64_t *k, int n) {
  bg1 tab[16];
  tab[1] = *p;
  bg1_double(&tab[2], p);
  for (int i = 3; i < 16; i++) bg1_add(&tab[i], &tab[i - 1], p);

  bg1 acc = bg1_inf();
  int started = 0;
  for (int i = n - 1; i >= 0; i--)
    for (int sh = 60; sh >= 0; sh -= 4) {
      if (started)
        for (int d = 0; d < 4; d++) {
          bg1 t;
          bg1_double(&t, &acc);
          acc = t;
        }
      const int w = (int)((k[i] >> sh) & 0xf);
      if (w) {
        if (started) {
          bg1 t;
          bg1_add(&t, &acc, &tab[w]);
          acc = t;
        } else {
          acc = tab[w];
          started = 1;
        }
      }
    }
  *out = acc;
}

static void bg1_affine(const bg1 *p, bfp *x, bfp *y) {
  if (bg1_is_inf(p)) {
    *x = BFP_ZERO;
    *y = BFP_ZERO;
    return;
  }
  const bfp zi = bfp_inv(p->z);
  const bfp zi2 = bfp_sqr(zi);
  *x = bfp_mul(p->x, zi2);
  *y = bfp_mul(p->y, bfp_mul(zi2, zi));
}

// ---------------------------------------------------------------------------
// G2: y^2 = x^3 + 4(1 + u) over Fp2
// ---------------------------------------------------------------------------

typedef struct {
  fp2 x, y, z;
} bg2;

static inline bg2 bg2_inf(void) {
  return (bg2){fp2_one(), fp2_one(), FP2_ZERO};
}
static inline int bg2_is_inf(const bg2 *p) { return fp2_is_zero(p->z); }

/** The twist's curve constant, `4 * xi`. */
static inline fp2 bg2_b(void) {
  const bfp two = bfp_add(bfp_one(), bfp_one());
  const bfp four = bfp_add(two, two);
  return (fp2){four, four};
}

static void bg2_double(bg2 *r, const bg2 *p) {
  if (bg2_is_inf(p) || fp2_is_zero(p->y)) {
    *r = bg2_inf();
    return;
  }
  const fp2 A = fp2_sqr(p->x);
  const fp2 B = fp2_sqr(p->y);
  const fp2 C = fp2_sqr(B);
  fp2 D = fp2_sqr(fp2_add(p->x, B));
  D = fp2_sub(D, A);
  D = fp2_sub(D, C);
  D = fp2_add(D, D);
  const fp2 E = fp2_add(fp2_add(A, A), A);
  const fp2 F = fp2_sqr(E);
  const fp2 x3 = fp2_sub(F, fp2_add(D, D));
  fp2 c8 = fp2_add(C, C);
  c8 = fp2_add(c8, c8);
  c8 = fp2_add(c8, c8);
  fp2 y3 = fp2_mul(E, fp2_sub(D, x3));
  y3 = fp2_sub(y3, c8);
  fp2 z3 = fp2_mul(p->y, p->z);
  z3 = fp2_add(z3, z3);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

static void bg2_add(bg2 *r, const bg2 *p, const bg2 *q) {
  if (bg2_is_inf(p)) {
    *r = *q;
    return;
  }
  if (bg2_is_inf(q)) {
    *r = *p;
    return;
  }
  // Both affine is the common case — it is what the add precompiles hand us,
  // and what the first steps of a scalar multiplication's table are. The
  // general formula squares and multiplies by two ones to discover that;
  // mmadd-2007-bl is four multiplications and two squarings against eleven
  // and five.
  if (fp2_eq(p->z, fp2_one()) && fp2_eq(q->z, fp2_one())) {
    const fp2 h = fp2_sub(q->x, p->x);
    if (fp2_is_zero(h)) {
      if (fp2_eq(p->y, q->y)) {
        bg2_double(r, p);
        return;
      }
      *r = bg2_inf();
      return;
    }
    const fp2 hh = fp2_sqr(h);
    fp2 i = fp2_add(hh, hh);
    i = fp2_add(i, i);
    const fp2 j = fp2_mul(h, i);
    const fp2 rr = fp2_add(fp2_sub(q->y, p->y), fp2_sub(q->y, p->y));
    const fp2 v = fp2_mul(p->x, i);
    fp2 x3 = fp2_sub(fp2_sub(fp2_sqr(rr), j), fp2_add(v, v));
    fp2 y1j = fp2_mul(p->y, j);
    y1j = fp2_add(y1j, y1j);
    r->x = x3;
    r->y = fp2_sub(fp2_mul(rr, fp2_sub(v, x3)), y1j);
    r->z = fp2_add(h, h);
    return;
  }
  const fp2 z1z1 = fp2_sqr(p->z);
  const fp2 z2z2 = fp2_sqr(q->z);
  const fp2 u1 = fp2_mul(p->x, z2z2);
  const fp2 u2 = fp2_mul(q->x, z1z1);
  const fp2 s1 = fp2_mul(fp2_mul(p->y, z2z2), q->z);
  const fp2 s2 = fp2_mul(fp2_mul(q->y, z1z1), p->z);
  const fp2 h = fp2_sub(u2, u1);
  const fp2 rr = fp2_sub(s2, s1);
  if (fp2_is_zero(h)) {
    if (fp2_is_zero(rr)) {
      bg2_double(r, p);
      return;
    }
    *r = bg2_inf();
    return;
  }
  const fp2 h2 = fp2_add(h, h);
  const fp2 i = fp2_sqr(h2);
  const fp2 j = fp2_mul(h, i);
  const fp2 r2 = fp2_add(rr, rr);
  const fp2 v = fp2_mul(u1, i);
  fp2 x3 = fp2_sqr(r2);
  x3 = fp2_sub(x3, j);
  x3 = fp2_sub(x3, fp2_add(v, v));
  fp2 y3 = fp2_mul(r2, fp2_sub(v, x3));
  const fp2 s1j = fp2_mul(s1, j);
  y3 = fp2_sub(y3, fp2_add(s1j, s1j));
  fp2 z3 = fp2_sqr(fp2_add(p->z, q->z));
  z3 = fp2_sub(z3, z1z1);
  z3 = fp2_sub(z3, z2z2);
  z3 = fp2_mul(z3, h);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

/**
 * `k * p`, four bits of the scalar at a time.
 *
 * The window turns an addition every bit into one every four, for a table of
 * fifteen multiples. Both multiplications an MSM point pays go through here —
 * the scalar itself, and the subgroup check every decode runs — so it is the
 * hot path of the MSM precompiles.
 */
static void bg2_mul(bg2 *out, const bg2 *p, const uint64_t *k, int n) {
  bg2 tab[16];
  tab[1] = *p;
  bg2_double(&tab[2], p);
  for (int i = 3; i < 16; i++) bg2_add(&tab[i], &tab[i - 1], p);

  bg2 acc = bg2_inf();
  int started = 0;
  for (int i = n - 1; i >= 0; i--)
    for (int sh = 60; sh >= 0; sh -= 4) {
      if (started)
        for (int d = 0; d < 4; d++) {
          bg2 t;
          bg2_double(&t, &acc);
          acc = t;
        }
      const int w = (int)((k[i] >> sh) & 0xf);
      if (w) {
        if (started) {
          bg2 t;
          bg2_add(&t, &acc, &tab[w]);
          acc = t;
        } else {
          acc = tab[w];
          started = 1;
        }
      }
    }
  *out = acc;
}

static void bg2_affine(const bg2 *p, fp2 *x, fp2 *y) {
  if (bg2_is_inf(p)) {
    *x = FP2_ZERO;
    *y = FP2_ZERO;
    return;
  }
  const fp2 zi = fp2_inv(p->z);
  const fp2 zi2 = fp2_sqr(zi);
  *x = fp2_mul(p->x, zi2);
  *y = fp2_mul(p->y, fp2_mul(zi2, zi));
}

// ---------------------------------------------------------------------------
// The optimal ate pairing
// ---------------------------------------------------------------------------

// |z| for z = -0xd201000000010000. The loop count is the parameter itself, not
// 6z + 2 as for a BN curve, and the sign is handled by conjugating at the end.
#define BLS_Z 0xD201000000010000ULL
#define BLS_Z_BITS 64

/**
 * The line through `a` and `b` (or the tangent at `a`), evaluated at the affine
 * G1 point `(px, py)` and lifted into Fp12.
 *
 * The twist here is M-type — `b' = 4*xi`, not `4/xi` — so untwisting is
 * `(x, y) -> (x/w^2, y/w^3)` and the untwisted slope is `slope/w`. Rewriting
 * `1/w` and `1/w^3` in the `v, w` basis using `v = w^2` and `v^3 = xi` gives
 * `1/w = v^2 w / xi` and `1/w^3 = v w / xi`, which is where the two divisions
 * by xi below come from.
 */
static fp12_line bg2_line(const fp2 ax, const fp2 ay, const fp2 bx,
                          const fp2 by, bfp px, bfp py, int tangent) {
  fp2 slope;
  if (tangent) {
    fp2 num = fp2_sqr(ax);
    num = fp2_add(fp2_add(num, num), num);
    slope = fp2_mul(num, fp2_inv(fp2_add(ay, ay)));
  } else {
    slope = fp2_mul(fp2_sub(by, ay), fp2_inv(fp2_sub(bx, ax)));
  }
  return (fp12_line){(fp2){py, BFP_ZERO},
                     fp2_div_xi(fp2_sub(fp2_mul(slope, ax), ay)),
                     fp2_div_xi(fp2_neg(fp2_mul_fp(slope, px)))};
}

/** Reduces a Jacobian G2 point to affine coordinates in place. */
static void bg2_to_affine_xy(const bg2 *t, fp2 *x, fp2 *y) {
  const fp2 zi = fp2_inv(t->z);
  const fp2 zi2 = fp2_sqr(zi);
  *x = fp2_mul(t->x, zi2);
  *y = fp2_mul(t->y, fp2_mul(zi2, zi));
}

/** The Miller loop for `e(P, Q)`, with both points affine and non-trivial. */
static fp12 bls_miller(bfp px, bfp py, fp2 qx, fp2 qy) {
  fp12 f = fp12_one();
  fp2 rx = qx, ry = qy;
  for (int bit = BLS_Z_BITS - 2; bit >= 0; bit--) {
    f = fp12_sqr(f);
    f = fp12_mul_line(f, bg2_line(rx, ry, rx, ry, px, py, 1));
    {
      bg2 rj = (bg2){rx, ry, fp2_one()}, t;
      bg2_double(&t, &rj);
      bg2_to_affine_xy(&t, &rx, &ry);
    }
    if ((BLS_Z >> bit) & 1) {
      f = fp12_mul_line(f, bg2_line(rx, ry, qx, qy, px, py, 0));
      bg2 rj = (bg2){rx, ry, fp2_one()}, qj = (bg2){qx, qy, fp2_one()}, t;
      bg2_add(&t, &rj, &qj);
      bg2_to_affine_xy(&t, &rx, &ry);
    }
  }
  // z is negative, so the accumulated value is the inverse of the one wanted.
  // In the cyclotomic subgroup the final exponentiation reaches, conjugation is
  // inversion, and the easy part below puts f there first.
  return fp12_conj(f);
}

/** `a^z` for the curve parameter, inside the cyclotomic subgroup. */
static fp12 fp12_expt(fp12 a) {
  fp12 r = a;
  // `BLS_Z` holds |z|, whose top bit starts the loop. It has a Hamming weight
  // of six, so this is 63 squarings and five multiplications and a window
  // would only add table cost.
  for (int i = BLS_Z_BITS - 2; i >= 0; i--) {
    r = fp12_cyclo_sqr(r);
    if ((BLS_Z >> i) & 1) r = fp12_mul(r, a);
  }
  // z is negative, and conjugation is inversion in this subgroup.
  return fp12_conj(r);
}

/**
 * `f^(3 * (p^4 - p^2 + 1)/r)`, by the addition chain rather than the exponent.
 *
 * The exponent is 1268 bits, and a windowed walk over it is 1268 cyclotomic
 * squarings and some three hundred multiplications. For a BLS12 curve it
 * factors through the parameter `z`,
 *
 *   3 * (p^4 - p^2 + 1)/r = (z-1)^2 (z + p) (z^2 + p^2 - 1) + 3
 *
 * which is Hayashida, Hayasaka and Teruya's identity, verified against the
 * exponent before any of this was written. Five exponentiations by `z` -- 63
 * squarings each, since |z| has a Hamming weight of six -- and a handful of
 * multiplications and Frobenius maps replace the walk.
 *
 * The result is the cube of the pairing value. `r` is prime and not 3, so
 * cubing is a bijection on the r-torsion and "is it one" is unchanged; both
 * callers ask only that. It is not the pairing itself, and nothing here should
 * start treating it as such.
 */
static fp12 bls_hard_part(fp12 f) {
  fp12 t = fp12_mul(fp12_expt(f), fp12_conj(f));  // f^(z-1)
  t = fp12_mul(fp12_expt(t), fp12_conj(t));       // f^((z-1)^2)
  t = fp12_mul(fp12_expt(t), fp12_frobenius(t));  // ... ^(z + p)
  const fp12 tz2 = fp12_expt(fp12_expt(t));
  const fp12 tp2 = fp12_frobenius(fp12_frobenius(t));
  t = fp12_mul(fp12_mul(tz2, tp2), fp12_conj(t)); // ... ^(z^2 + p^2 - 1)
  return fp12_mul(t, fp12_mul(fp12_cyclo_sqr(f), f)); // ... * f^3
}

/** The final exponentiation, `f^((p^12 - 1) / r)`, up to the cube above. */
static fp12 bls_final_exp(fp12 f) {
  fp12 t = fp12_mul(fp12_conj(f), fp12_inv(f));
  const fp12 t2 = fp12_frobenius(fp12_frobenius(t));
  t = fp12_mul(t, t2);
  return bls_hard_part(t);
}

// ---------------------------------------------------------------------------
// EIP-2537 encoding
// ---------------------------------------------------------------------------

/**
 * Reads a field element from its 64-byte encoding.
 *
 * The top 16 bytes must be zero and the value must be below the modulus; both
 * are hard failures, not silent reductions.
 */
static int bls_read_fp(const uint8_t *in, bfp *out) {
  for (int i = 0; i < 16; i++)
    if (in[i]) return 0;
  uint64_t raw[BFP_LIMBS] = {0};
  for (int i = 0; i < 48; i++) {
    const int nib = 47 - i; // byte index from the bottom
    raw[nib / 8] |= (uint64_t)in[16 + i] << ((nib % 8) * 8);
  }
  if (bfp_ge_p(raw)) return 0;
  *out = bfp_to_mont(raw);
  return 1;
}

static void bls_write_fp(bfp a, uint8_t *out) {
  uint64_t raw[BFP_LIMBS];
  bfp_from_mont(a, raw);
  for (int i = 0; i < 16; i++) out[i] = 0;
  for (int i = 0; i < 48; i++) {
    const int nib = 47 - i;
    out[16 + i] = (uint8_t)(raw[nib / 8] >> ((nib % 8) * 8));
  }
}

static inline int bls_read_fp2(const uint8_t *in, fp2 *out) {
  // EIP-2537 puts the real part first, unlike EIP-197's bn254 encoding.
  return bls_read_fp(in, &out->c0) && bls_read_fp(in + 64, &out->c1);
}

static inline void bls_write_fp2(fp2 a, uint8_t *out) {
  bls_write_fp(a.c0, out);
  bls_write_fp(a.c1, out + 64);
}

/**
 * Reads a G1 point from 128 bytes.
 *
 * `subgroup` asks for the order-r membership check, which the MSM and pairing
 * precompiles require and the addition precompile does not.
 */
static int bls_read_g1(const uint8_t *in, bg1 *out, int subgroup) {
  bfp x, y;
  if (!bls_read_fp(in, &x) || !bls_read_fp(in + 64, &y)) return 0;
  if (bfp_is_zero(x) && bfp_is_zero(y)) {
    *out = bg1_inf();
    return 1;
  }
  const bfp two = bfp_add(bfp_one(), bfp_one());
  const bfp four = bfp_add(two, two);
  if (!bfp_eq(bfp_sqr(y), bfp_add(bfp_mul(bfp_sqr(x), x), four))) return 0;
  out->x = x;
  out->y = y;
  out->z = bfp_one();
  if (subgroup) {
    bg1 c;
    bg1_mul(&c, out, BLS_ORDER, 4);
    if (!bg1_is_inf(&c)) return 0;
  }
  return 1;
}

static void bls_write_g1(const bg1 *p, uint8_t *out) {
  bfp x, y;
  bg1_affine(p, &x, &y);
  bls_write_fp(x, out);
  bls_write_fp(y, out + 64);
}

static int bls_read_g2(const uint8_t *in, bg2 *out, int subgroup) {
  fp2 x, y;
  if (!bls_read_fp2(in, &x) || !bls_read_fp2(in + 128, &y)) return 0;
  if (fp2_is_zero(x) && fp2_is_zero(y)) {
    *out = bg2_inf();
    return 1;
  }
  if (!fp2_eq(fp2_sqr(y), fp2_add(fp2_mul(fp2_sqr(x), x), bg2_b()))) return 0;
  out->x = x;
  out->y = y;
  out->z = fp2_one();
  if (subgroup) {
    bg2 c;
    bg2_mul(&c, out, BLS_ORDER, 4);
    if (!bg2_is_inf(&c)) return 0;
  }
  return 1;
}

static void bls_write_g2(const bg2 *p, uint8_t *out) {
  fp2 x, y;
  bg2_affine(p, &x, &y);
  bls_write_fp2(x, out);
  bls_write_fp2(y, out + 128);
}

// EIP-2537's multi-scalar-multiplication discount, in thousandths. The curve
// flattens quickly and is clamped at 128 terms.
static const uint16_t BLS_G1_DISCOUNT[128] = {
    1000, 949, 848, 797, 764, 750, 738, 728, 719, 712, 705, 698, 692, 687, 682,
    677,  673, 669, 665, 661, 658, 654, 651, 648, 645, 642, 640, 637, 635, 632,
    630,  627, 625, 623, 621, 619, 617, 615, 613, 611, 609, 608, 606, 604, 603,
    601,  599, 598, 596, 595, 593, 592, 591, 589, 588, 586, 585, 584, 582, 581,
    580,  579, 577, 576, 575, 574, 573, 572, 570, 569, 568, 567, 566, 565, 564,
    563,  562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550, 549,
    548,  547, 547, 546, 545, 544, 543, 542, 541, 540, 540, 539, 538, 537, 536,
    536,  535, 534, 533, 532, 532, 531, 530, 529, 528, 528, 527, 526, 525, 525,
    524,  523, 522, 522, 521, 520, 520, 519};

static const uint16_t BLS_G2_DISCOUNT[128] = {
    1000, 1000, 923, 884, 855, 832, 812, 796, 782, 770, 759, 749, 740, 732, 724,
    717,  711,  704, 699, 693, 688, 683, 679, 674, 670, 666, 663, 659, 655, 652,
    649,  646,  643, 640, 637, 634, 632, 629, 627, 624, 622, 620, 618, 615, 613,
    611,  609,  607, 606, 604, 602, 600, 598, 597, 595, 593, 592, 590, 589, 587,
    586,  584,  583, 582, 580, 579, 578, 576, 575, 574, 573, 571, 570, 569, 568,
    567,  566,  565, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552,
    552,  551,  550, 549, 548, 547, 546, 545, 545, 544, 543, 542, 541, 541, 540,
    539,  538,  537, 537, 536, 535, 535, 534, 533, 532, 532, 531, 530, 530, 529,
    528,  528,  527, 526, 526, 525, 524, 524};

static inline int64_t bls_msm_discount(uint64_t k, int g1) {
  const uint16_t *table = g1 ? BLS_G1_DISCOUNT : BLS_G2_DISCOUNT;
  if (k == 0) return 1000;
  if (k > 128) k = 128;
  return table[k - 1];
}

// ---------------------------------------------------------------------------
// EIP-4844 point evaluation
// ---------------------------------------------------------------------------

// Generators and the trusted setup's [s]G2, in plain limbs. The setup point is
// element 1 of `g2_monomial` in `src/trusted-setups`, decompressed.
static const uint64_t BLS_G1_GEN_X[BFP_LIMBS] = {
    0xFB3AF00ADB22C6BBULL, 0x6C55E83FF97A1AEFULL, 0xA14E3A3F171BAC58ULL,
    0xC3688C4F9774B905ULL, 0x2695638C4FA9AC0FULL, 0x17F1D3A73197D794ULL};
static const uint64_t BLS_G1_GEN_Y[BFP_LIMBS] = {
    0x0CAA232946C5E7E1ULL, 0xD03CC744A2888AE4ULL, 0x00DB18CB2C04B3EDULL,
    0xFCF5E095D5D00AF6ULL, 0xA09E30ED741D8AE4ULL, 0x08B3F481E3AAA0F1ULL};
static const uint64_t BLS_G2_GEN[4][BFP_LIMBS] = {
    {0xD48056C8C121BDB8ULL, 0x0BAC0326A805BBEFULL, 0xB4510B647AE3D177ULL,
     0xC6E47AD4FA403B02ULL, 0x260805272DC51051ULL, 0x024AA2B2F08F0A91ULL},
    {0xE5AC7D055D042B7EULL, 0x334CF11213945D57ULL, 0xB5DA61BBDC7F5049ULL,
     0x596BD0D09920B61AULL, 0x7DACD3A088274F65ULL, 0x13E02B6052719F60ULL},
    {0xE193548608B82801ULL, 0x923AC9CC3BACA289ULL, 0x6D429A695160D12CULL,
     0xADFD9BAA8CBDD3A7ULL, 0x8CC9CDC6DA2E351AULL, 0x0CE5D527727D6E11ULL},
    {0xAAA9075FF05F79BEULL, 0x3F370D275CEC1DA1ULL, 0x267492AB572E99ABULL,
     0xCB3E287E85A763AFULL, 0x32ACD2B02BC28B99ULL, 0x0606C4A02EA734CCULL}};
static const uint64_t BLS_SETUP_G2[4][BFP_LIMBS] = {
    {0xC98EDADA20C1DEF2ULL, 0x087041DE621000EDULL, 0xA36851477BA4C60BULL,
     0x3926C911CCECEAC9ULL, 0x734429B7B38608E2ULL, 0x185CBFEE53492714ULL},
    {0xAFAAAB24F3499F72ULL, 0x2914E5870CB452D2ULL, 0x1009A2CE615AC53DULL,
     0x26187075CBFBEFA8ULL, 0x843BC287230AF389ULL, 0x15BFD7DD8CDEB128ULL},
    {0xEE689BFBBB832A99ULL, 0x4CE26D105941F383ULL, 0xE82451A496A9C979ULL,
     0x131569490E28DE18ULL, 0xD7D5EE8599D1FCA2ULL, 0x014353BDB96B626DULL},
    {0x23048EF30D0A154FULL, 0x9495346F3D7AC9CDULL, 0xDA5ED1BA9BFA0789ULL,
     0xEF79DE09FC63671FULL, 0x03432FCAE0181B4BULL, 0x1666C54B0A325295ULL}};

// (p - 1) / 2, the threshold for "lexicographically larger" in the ZCash
// point encoding.
static const uint64_t BLS_P_HALF[BFP_LIMBS] = {0xDCFF7FFFFFFFD555ULL, 0x0F55FFFF58A9FFFFULL, 0xB39869507B587B12ULL, 0xB23BA5C279C2895FULL, 0x258DD3DB21A5D66BULL, 0x0D0088F51CBFF34DULL};

// (p + 1) / 4, the square-root exponent; p is 3 mod 4.
static const uint64_t BLS_SQRT_EXP[BFP_LIMBS] = {
    0xEE7FBFFFFFFFEAABULL, 0x07AAFFFFAC54FFFFULL, 0xD9CC34A83DAC3D89ULL,
    0xD91DD2E13CE144AFULL, 0x92C6E9ED90D2EB35ULL, 0x0680447A8E5FF9A6ULL};

static inline bg1 bls_g1_generator(void) {
  return (bg1){bfp_to_mont(BLS_G1_GEN_X), bfp_to_mont(BLS_G1_GEN_Y),
               bfp_one()};
}

static inline bg2 bls_g2_from(const uint64_t c[4][BFP_LIMBS]) {
  bg2 q;
  q.x = (fp2){bfp_to_mont(c[0]), bfp_to_mont(c[1])};
  q.y = (fp2){bfp_to_mont(c[2]), bfp_to_mont(c[3])};
  q.z = fp2_one();
  return q;
}

/**
 * Decompresses a 48-byte ZCash-serialised G1 point.
 *
 * The top three bits of the first byte are flags: compressed, infinity, and the
 * sign that picks between the two square roots. Returns 0 on any malformed
 * input, including an uncompressed or out-of-range encoding.
 */
static int bls_decompress_g1(const uint8_t *in, bg1 *out) {
  const uint8_t flags = in[0];
  if (!(flags & 0x80)) return 0; // must be the compressed form
  const int infinity = (flags & 0x40) != 0;
  const int sign = (flags & 0x20) != 0;
  uint64_t raw[BFP_LIMBS] = {0};
  for (int i = 0; i < 48; i++) {
    const uint8_t byte = i == 0 ? (uint8_t)(in[0] & 0x1f) : in[i];
    const int nib = 47 - i;
    raw[nib / 8] |= (uint64_t)byte << ((nib % 8) * 8);
  }
  if (infinity) {
    // The infinity encoding must carry no coordinate and no sign.
    for (int i = 0; i < BFP_LIMBS; i++)
      if (raw[i]) return 0;
    if (sign) return 0;
    *out = bg1_inf();
    return 1;
  }
  if (bfp_ge_p(raw)) return 0;
  const bfp x = bfp_to_mont(raw);
  const bfp two = bfp_add(bfp_one(), bfp_one());
  const bfp four = bfp_add(two, two);
  const bfp y2 = bfp_add(bfp_mul(bfp_sqr(x), x), four);
  bfp y = bfp_pow(y2, BLS_SQRT_EXP, BFP_LIMBS);
  if (!bfp_eq(bfp_sqr(y), y2)) return 0; // x is not on the curve
  // The sign bit selects the lexicographically larger root, which for this
  // prime means the one above (p - 1) / 2.
  uint64_t plain[BFP_LIMBS];
  bfp_from_mont(y, plain);
  int larger = 0;
  for (int i = BFP_LIMBS - 1; i >= 0; i--) {
    if (plain[i] != BLS_P_HALF[i]) {
      larger = plain[i] > BLS_P_HALF[i];
      break;
    }
  }
  if (larger != sign) y = bfp_neg(y);
  out->x = x;
  out->y = y;
  out->z = bfp_one();
  bg1 check;
  bg1_mul(&check, out, BLS_ORDER, 4);
  return bg1_is_inf(&check);
}


// ---------------------------------------------------------------------------
// RFC 9380 map-to-curve constants, for precompiles 0x10 and 0x11
//
// The SWU curves E' are isogenous to G1 and G2, not equal to them: the map
// lands on E' and an isogeny carries it across. Every value here is derived
// from p by scripts/../gen-swu.mjs, except the isogeny coefficient tables,
// which come from `@noble/curves`.
// ---------------------------------------------------------------------------

// E' for G1: y^2 = x^3 + A x + B, with SWU parameter Z = 11.
static const uint64_t SWU_G1_A[BFP_LIMBS] = {
    0x5CF428082D584C1DULL, 0x98936F8DA0E0F97FULL, 0xD8E8981AEFD881ACULL, 0xB0EA985383EE66A8ULL, 0x3D693A02C96D4982ULL, 0x00144698A3B8E943ULL};
static const uint64_t SWU_G1_B[BFP_LIMBS] = {
    0xD1CC48E98E172BE0ULL, 0x5A23215A316CEAA5ULL, 0xA0B9C14FCEF35EF5ULL, 0x2016C1F0F24F4070ULL, 0x018B12E8753EEE3BULL, 0x12E2908D11688030ULL};
static const uint64_t SWU_G1_Z[BFP_LIMBS] = {
    0x000000000000000BULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL};
// -B/A and -1/Z, the two quotients RFC 9380 steps 7 and 8 need.
static const uint64_t SWU_G1_MBA[BFP_LIMBS] = {
    0x29D670675E4C9C7CULL, 0x51BDFCF95A84188EULL, 0x1DF39753AA278BA7ULL, 0xA928AD9F5BDBFAC2ULL, 0x66EF2470460C78F6ULL, 0x0793154FD85631D9ULL};
static const uint64_t SWU_G1_MZINV[BFP_LIMBS] = {
    0xE25CFFFFFFFFF83EULL, 0x02C9D1743EAA8BA2ULL, 0xAC4A41B18ACA44ECULL, 0x09221E235BF4D328ULL, 0xC102839C34A9C9E5ULL, 0x025D302C90DD14F6ULL};

// E' for G2: A' = 240 i, B' = 1012 (1 + i), Z = -(2 + i).
static const uint64_t SWU_G2_A[2][BFP_LIMBS] = {
    {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
    {0x00000000000000F0ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}};
static const uint64_t SWU_G2_B[2][BFP_LIMBS] = {
    {0x00000000000003F4ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
    {0x00000000000003F4ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}};
static const uint64_t SWU_G2_Z[2][BFP_LIMBS] = {
    {0xB9FEFFFFFFFFAAA9ULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL},
    {0xB9FEFFFFFFFFAAAAULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}};
static const uint64_t SWU_G2_MBA[2][BFP_LIMBS] = {
    {0x725D8CCCCCCCB1C3ULL, 0xD6834443DA498888ULL, 0x02CF75E62BFC4DF1ULL, 0x9B8C2D3F6F3F7923ULL, 0xFE2F284F0CC6E5AAULL, 0x083C12791ABDD5D2ULL},
    {0x47A173333332F8E8ULL, 0x4828BBBAD70A7777ULL, 0x64615CBACAB4A832ULL, 0xC8EB1E458445999CULL, 0x4CEC7F673684C72CULL, 0x11C4FF711EC210C7ULL}};
static const uint64_t SWU_G2_MZINV[2][BFP_LIMBS] = {
    {0x2E65999999995556ULL, 0xB223333227766666ULL, 0xEC270EE72BC0C4E9ULL, 0x1D2C3C6A5C6A7565ULL, 0x08E2EC91CF6FBD79ULL, 0x14CDA7EE94665215ULL},
    {0xA2CC333333330000ULL, 0x459A66659D98CCCCULL, 0x711D4B2D60D093AFULL, 0xD5E12D4FC54FD80CULL, 0xC6AA316D5B93CE1AULL, 0x0F9A3DF2EF4CBD8FULL}};

// psi, the untwist-Frobenius-twist endomorphism. psi^2 multiplies x by a
// constant and negates y — the generator asserts that second half.
static const uint64_t BLS_PSI_X[2][BFP_LIMBS] = {
    {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
    {0x8BFD00000000AAADULL, 0x409427EB4F49FFFDULL, 0x897D29650FB85F9BULL, 0xAA0D857D89759AD4ULL, 0xEC02408663D4DE85ULL, 0x1A0111EA397FE699ULL}};
static const uint64_t BLS_PSI_Y[2][BFP_LIMBS] = {
    {0xF1EE7B04121BDEA2ULL, 0x304466CF3E67FA0AULL, 0xEF396489F61EB45EULL, 0x1C3DEDD930B1CF60ULL, 0xE2E9C448D77A2CD9ULL, 0x135203E60180A68EULL},
    {0xC81084FBEDE3CC09ULL, 0xEE67992F72EC05F4ULL, 0x77F76E17009241C5ULL, 0x48395DABC2D3435EULL, 0x6831E36D6BD17FFEULL, 0x06AF0E0437FF400BULL}};
static const uint64_t BLS_PSI2_X[2][BFP_LIMBS] = {
    {0x8BFD00000000AAACULL, 0x409427EB4F49FFFDULL, 0x897D29650FB85F9BULL, 0xAA0D857D89759AD4ULL, 0xEC02408663D4DE85ULL, 0x1A0111EA397FE699ULL},
    {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}};

// (p - 1) / 2, the Euler criterion exponent.
static const uint64_t BLS_EULER_EXP[BFP_LIMBS] = {
    0xDCFF7FFFFFFFD555ULL, 0x0F55FFFF58A9FFFFULL, 0xB39869507B587B12ULL, 0xB23BA5C279C2895FULL, 0x258DD3DB21A5D66BULL, 0x0D0088F51CBFF34DULL};

// The 11-isogeny from E' to G1 and the 3-isogeny from E' to G2 (RFC 9380
// appendices E.2 and E.3), ascending in the polynomial degree.
static const uint64_t ISO_G1_XNUM[12][BFP_LIMBS] = {
    {0xAEAC1662734649B7ULL, 0x5610C2D5F2E62D6EULL, 0xF2627B56CDB4E2C8ULL, 0x6B303E88A2D7005FULL, 0xB809101DD9981585ULL, 0x11A05F2B1E833340ULL},
    {0xE834EEF1B3CB83BBULL, 0x4838F2A6F318C356ULL, 0xF565E33C70D1E86BULL, 0x7C17E75B2F6A8417ULL, 0x0588BAB22147A81CULL, 0x17294ED3E943AB2FULL},
    {0xE0179F9DAC9EDCB0ULL, 0x958C3E3D2A09729FULL, 0x6878E501EC68E25CULL, 0xCE032473295983E5ULL, 0x1D1048C5D10A9A1BULL, 0x0D54005DB97678ECULL},
    {0xC5B388641D9B6861ULL, 0x5336E25CE3107193ULL, 0xF1B33289F1B33083ULL, 0xD7F5E4656A8DBF25ULL, 0x4E0609D307E55412ULL, 0x1778E7166FCC6DB7ULL},
    {0x51154CE9AC8895D9ULL, 0x985A286F301E77C4ULL, 0x086EEB65982FAC18ULL, 0x99DB995A1257FB3FULL, 0x6642B4B3E4118E54ULL, 0x0E99726A3199F443ULL},
    {0xCD13C1C66F652983ULL, 0xA0870D2DCAE73D19ULL, 0x9ED3AB9097E68F90ULL, 0xDB3CB17DD952799BULL, 0x01D1201BF7A74AB5ULL, 0x1630C3250D7313FFULL},
    {0xDDD7F225A139ED84ULL, 0x8DA25128C1052ECAULL, 0x9008E218F9C86B2AULL, 0xB11586264F0F8CE1ULL, 0x6A3726C38AE652BFULL, 0x0D6ED6553FE44D29ULL},
    {0x9CCB5618E3F0C88EULL, 0x39B7C8F8C8F475AFULL, 0xA682C62EF0F27533ULL, 0x356DE5AB275B4DB1ULL, 0xE8743884D1117E53ULL, 0x17B81E7701ABDBE2ULL},
    {0x6D71986A8497E317ULL, 0x4FA295F296B74E95ULL, 0xA2C596C928C5D1DEULL, 0xC43B756CE79F5574ULL, 0x7B90B33563BE990DULL, 0x080D3CF1F9A78FC4ULL},
    {0x7F241067BE390C9EULL, 0xA3190B2EDC032779ULL, 0x676314BAF4BB1B7FULL, 0xDD2ECB803A0C5C99ULL, 0x2E0C37515D138F22ULL, 0x169B1F8E1BCFA7C4ULL},
    {0xCA67DF3F1605FB7BULL, 0xF69B771F8C285DECULL, 0xD50AF36003B14866ULL, 0xFA7DCCDDE6787F96ULL, 0x72D8EC09D2565B0DULL, 0x10321DA079CE07E2ULL},
    {0xA9C8BA2E8BA2D229ULL, 0xC24B1B80B64D391FULL, 0x23C0BF1BC24C6B68ULL, 0x31D79D7E22C837BCULL, 0xBD1E962381EDEE3DULL, 0x06E08C248E260E70ULL},
};
static const uint64_t ISO_G1_XDEN[11][BFP_LIMBS] = {
    {0x993CF9FA40D21B1CULL, 0xB558D681BE343DF8ULL, 0x9C9588617FC8AC62ULL, 0x01D5EF4BA35B48BAULL, 0x18B2E62F4BD3FA6FULL, 0x08CA8D548CFF19AEULL},
    {0xE5C8276EC82B3BFFULL, 0x13DAA8846CB026E9ULL, 0x0126C2588C48BF57ULL, 0x7041E8CA0CF0800CULL, 0x48B4711298E53636ULL, 0x12561A5DEB559C43ULL},
    {0xFCC239BA5CB83E19ULL, 0xD6A3D0967C94FEDCULL, 0xFCA64E00B11ACEACULL, 0x6F89416F5A718CD1ULL, 0x8137E629BFF2991FULL, 0x0B2962FE57A3225EULL},
    {0x130DE8938DC62CD8ULL, 0x4976D5243EECF5C4ULL, 0x54CCA8ABC28D6FD0ULL, 0x5B08243F16B16551ULL, 0xC83AAFEF7C40EB54ULL, 0x03425581A58AE2FEULL},
    {0x539D395B3532A21EULL, 0x9BD29BA81F35781DULL, 0x8D6B44E833B306DAULL, 0xFFDFC759A12062BBULL, 0x0A6F1D5F43E7A07DULL, 0x13A8E162022914A8ULL},
    {0xC02DF9A29F6304A5ULL, 0x7400D24BC4228F11ULL, 0x0A43BCEF24B8982FULL, 0x395735E9CE9CAD4DULL, 0x55390F7F0506C6E9ULL, 0x0E7355F8E4E667B9ULL},
    {0xEC2574496EE84A3AULL, 0xEA73B3538F0DE06CULL, 0x4E2E073062AEDE9CULL, 0x570F5799AF53A189ULL, 0x0F3E0C63E0596721ULL, 0x0772CAACF1693619ULL},
    {0x11F7D99BBDCC5A5EULL, 0x0FA5B9489D11E2D3ULL, 0x1996E1CDF9822C58ULL, 0x6E7F63C21BCA68A8ULL, 0x30B3F5B074CF0199ULL, 0x14A7AC2A9D64A8B2ULL},
    {0x4776EC3A79A1D641ULL, 0x03826692ABBA4370ULL, 0x74100DA67F398835ULL, 0xE07F8D1D7161366BULL, 0x5E920B3DAFC7A3CCULL, 0x0A10ECF6ADA54F82ULL},
    {0x2D6384D168ECDD0AULL, 0x93174E4B4B786500ULL, 0x76DF533978F31C15ULL, 0xF682B4EE96F7D037ULL, 0x476D6E3EB3A56680ULL, 0x095FC13AB9E92AD4ULL},
    {0x0000000000000001ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
};
static const uint64_t ISO_G1_YNUM[16][BFP_LIMBS] = {
    {0xBE9845719707BB33ULL, 0xCD0C7AEE9B3BA3C2ULL, 0x2B52AF6C956543D3ULL, 0x11AD138E48A86952ULL, 0x259D1F094980DCFAULL, 0x090D97C81BA24EE0ULL},
    {0xE097E75A2E41C696ULL, 0xD6C56711962FA8BFULL, 0x0F906343EB67AD34ULL, 0x1223E96C254F383DULL, 0xD51036D776FB4683ULL, 0x134996A104EE5811ULL},
    {0xB8DFE240C72DE1F6ULL, 0xD26D521628B00523ULL, 0xC344BE4B91400DA7ULL, 0x2552E2D658A31CE2ULL, 0xF4A384C86A3B4994ULL, 0x00CC786BAA966E66ULL},
    {0xA6355C77B0E5F4CBULL, 0xDE405ABA9EC61DECULL, 0x09E4A3EC03251CF9ULL, 0xD42AA7B90EEB791CULL, 0x7898751AD8746757ULL, 0x01F86376E8981C21ULL},
    {0x41B6DAECF2E8FEDBULL, 0x2EE7F8DC099040A8ULL, 0x79833FD221351ADCULL, 0x195536FBE3CE50B8ULL, 0x5CAF4FE2A21529C4ULL, 0x08CC03FDEFE0FF13ULL},
    {0x99B23AB13633A5F0ULL, 0x203F6326C95A8072ULL, 0x76505C3D3AD5544EULL, 0x74A7D0D4AFADB7BDULL, 0x2211E11DB8F0A6A0ULL, 0x16603FCA40634B6AULL},
    {0xC961F8855FE9D6F2ULL, 0x47A87AC2460F415EULL, 0x5231413C4D634F37ULL, 0xE75BB8CA2BE184CBULL, 0xB2C977D027796B3CULL, 0x04AB0B9BCFAC1BBCULL},
    {0xA15E4CA31870FB29ULL, 0x42F64550FEDFE935ULL, 0xFD038DA6C26C8426ULL, 0x170A05BFE3BDD81FULL, 0xDE9926BD2CA6C674ULL, 0x0987C8D5333AB86FULL},
    {0x60370E577BDBA587ULL, 0x69D65201C78607A3ULL, 0x1E8B6E6A1F20CABEULL, 0x8F3ABD16679DC26CULL, 0xE88C9E221E4DA1BBULL, 0x09FC4018BD96684BULL},
    {0x2BAFAAEBCA731C30ULL, 0x9B3F7055DD4EBA6FULL, 0x06985E7ED1E4D43BULL, 0xC42A0CA7915AF6FEULL, 0x223ABDE7ADA14A23ULL, 0x0E1BBA7A1186BDB5ULL},
    {0xE813711AD011C132ULL, 0x31BF3A5CCE3FBAFCULL, 0xD1183E416389E610ULL, 0xCD2FCBCB6CAF493FULL, 0x0DFD0B8F1D43FB93ULL, 0x19713E47937CD1BEULL},
    {0xCE07C8A4D0074D8EULL, 0x49D9CDF41B44D606ULL, 0x2E6BFE7F911F6432ULL, 0x523559B8AAF0C246ULL, 0xB918C143FED2EDCCULL, 0x18B46A908F36F6DEULL},
    {0x0D4C04F00B971EF8ULL, 0x06C851C1919211F2ULL, 0xC02710E807B4633FULL, 0x7AA7B12A3426B08EULL, 0xD155096004F53F44ULL, 0x0B182CAC101B9399ULL},
    {0x42D9D3F5DB980133ULL, 0xC6CF90AD1C232A64ULL, 0x13E6632D3C40659CULL, 0x757B3B080D4C1580ULL, 0x72FC00AE7BE315DCULL, 0x0245A394AD1ECA9BULL},
    {0x866B1E715475224BULL, 0x6BA1049B6579AFB7ULL, 0xD9AB0F5D396A7CE4ULL, 0x5E673D81D7E86568ULL, 0x02A159F748C4A3FCULL, 0x05C129645E44CF11ULL},
    {0x04B456BE69C8B604ULL, 0xB665027EFEC01C77ULL, 0x57ADD4FA95AF01B2ULL, 0xCB181D8F84965A39ULL, 0x4EA50B3B42DF2EB5ULL, 0x15E6BE4E990F03CEULL},
};
static const uint64_t ISO_G1_YDEN[16][BFP_LIMBS] = {
    {0x01479253B03663C1ULL, 0x07F3688EF60C206DULL, 0xEEC3232B5BE72E7AULL, 0x601A6DE578980BE6ULL, 0x52181140FAD0EAE9ULL, 0x16112C4C3A9C98B2ULL},
    {0x32F6102C2E49A03DULL, 0x78A4260763529E35ULL, 0xA4A10356F453E01FULL, 0x85C84FF731C4D59CULL, 0x1A0CBD6C43C348B8ULL, 0x1962D75C2381201EULL},
    {0x1E2538B53DBF67F2ULL, 0xA6757CD636F96F89ULL, 0x0C35A5DD279CD2ECULL, 0x78C4855551AE7F31ULL, 0x6FAAAE7D6E8EB157ULL, 0x058DF3306640DA27ULL},
    {0xA8D26D98445F5416ULL, 0x727364F2C28297ADULL, 0x123DA489E726AF41ULL, 0xD115C5DBDDBCD30EULL, 0xF20D23BF89EDB4D1ULL, 0x16B7D288798E5395ULL},
    {0xDA39142311A5001DULL, 0xA20B15DC0FD2EDEDULL, 0x542EDA0FC9DEC916ULL, 0xC6D19C9F0F69BBB0ULL, 0xB00CC912F8228DDCULL, 0x0BE0E079545F43E4ULL},
    {0x02C6477FAAF9B7ACULL, 0x49F38DB9DFA9CCE2ULL, 0xC5ECD87B6F0F5A64ULL, 0xB70152C65550D881ULL, 0x9FB266EAAC783182ULL, 0x08D9E5297186DB2DULL},
    {0x3D1A1399126A775CULL, 0xD5FA9C01A58B1FB9ULL, 0x5DD365BC400A0051ULL, 0x5EECFDFA8D0CF8EFULL, 0xC3BA8734ACE9824BULL, 0x166007C08A99DB2FULL},
    {0x60EE415A15812ED9ULL, 0xB920F5B00801DEE4ULL, 0xFEB34FD206357132ULL, 0xE5A4375EFA1F4FD7ULL, 0x03BCDDFABBA6FF6EULL, 0x16A3EF08BE3EA7EAULL},
    {0x6B233D9D55535D4AULL, 0x52CFE2F7BB924883ULL, 0xABC5750C4BF39B48ULL, 0xF9FB0CE4C6AF5920ULL, 0x1A1BE54FD1D74CC4ULL, 0x1866C8ED336C6123ULL},
    {0x346EF48BB8913F55ULL, 0xC7385EA3D529B35EULL, 0x5308592E7EA7D4FBULL, 0x3216F763E13D87BBULL, 0xEA820597D94A8490ULL, 0x167A55CDA70A6E1CULL},
    {0x00F8B49CBA8F6AA8ULL, 0x71A5C29F4F830604ULL, 0x0E591B36E636A5C8ULL, 0x9C6DD039BB61A629ULL, 0x48F010A01AD2911DULL, 0x04D2F259EEA405BDULL},
    {0x9684B529E2561092ULL, 0x16F968986F7EBBEAULL, 0x8C0F9A88CEA79135ULL, 0x7F94FF8AEFCE42D2ULL, 0xF5852C1E48C50C47ULL, 0x0ACCBB67481D033FULL},
    {0x1E99B138573345CCULL, 0x93000763E3B90AC1ULL, 0x7D5CEEF9A00D9B86ULL, 0x543346D98ADF0226ULL, 0xC3613144B45F1496ULL, 0x0AD6B9514C767FE3ULL},
    {0xD1FADC1326ED06F7ULL, 0x420517BD8714CC80ULL, 0xCB748DF27942480EULL, 0xBF565B94E72927C1ULL, 0x628BDD0D53CD76F2ULL, 0x02660400EB2E4F3BULL},
    {0x4415473A1D634B8FULL, 0x5CA2F570F1349780ULL, 0x324EFCD6356CAA20ULL, 0x71C40F65E273B853ULL, 0x6B24255E0D7819C1ULL, 0x0E0FA1D816DDC03EULL},
    {0x0000000000000001ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
};
static const uint64_t ISO_G2_XNUM[4][2][BFP_LIMBS] = {
    {{0x6238AAAAAAAA97D6ULL, 0x5C2638E343D9C71CULL, 0x88B58423C50AE15DULL, 0x32C52D39FD3A042AULL, 0xBB5B7A9A47D7ED85ULL, 0x05C759507E8E333EULL},
     {0x6238AAAAAAAA97D6ULL, 0x5C2638E343D9C71CULL, 0x88B58423C50AE15DULL, 0x32C52D39FD3A042AULL, 0xBB5B7A9A47D7ED85ULL, 0x05C759507E8E333EULL}},
    {{0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0x26A9FFFFFFFFC71AULL, 0x1472AAA9CB8D5555ULL, 0x9A208C6B4F20A418ULL, 0x984F87ADF7AE0C7FULL, 0x32126FCED787C88FULL, 0x11560BF17BAA99BCULL}},
    {{0x26A9FFFFFFFFC71EULL, 0x1472AAA9CB8D5555ULL, 0x9A208C6B4F20A418ULL, 0x984F87ADF7AE0C7FULL, 0x32126FCED787C88FULL, 0x11560BF17BAA99BCULL},
     {0x9354FFFFFFFFE38DULL, 0x0A395554E5C6AAAAULL, 0xCD104635A790520CULL, 0xCC27C3D6FBD7063FULL, 0x190937E76BC3E447ULL, 0x08AB05F8BDD54CDEULL}},
    {{0x88E2AAAAAAAA5ED1ULL, 0x7098E38D0F671C71ULL, 0x22D6108F142B8575ULL, 0xCB14B4E7F4E810AAULL, 0xED6DEA691F5FB614ULL, 0x171D6541FA38CCFAULL},
     {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}},
};
static const uint64_t ISO_G2_XDEN[3][2][BFP_LIMBS] = {
    {{0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0xB9FEFFFFFFFFAA63ULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}},
    {{0x000000000000000CULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0xB9FEFFFFFFFFAA9FULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}},
    {{0x0000000000000001ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}},
};
static const uint64_t ISO_G2_YNUM[4][2][BFP_LIMBS] = {
    {{0x12CFC71C71C6D706ULL, 0xFC8C25EBF8C92F68ULL, 0xF54439D87D27E500ULL, 0x0F7DA5D4A07F649BULL, 0x59A4C18B076D1193ULL, 0x1530477C7AB4113BULL},
     {0x12CFC71C71C6D706ULL, 0xFC8C25EBF8C92F68ULL, 0xF54439D87D27E500ULL, 0x0F7DA5D4A07F649BULL, 0x59A4C18B076D1193ULL, 0x1530477C7AB4113BULL}},
    {{0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0x6238AAAAAAAA97BEULL, 0x5C2638E343D9C71CULL, 0x88B58423C50AE15DULL, 0x32C52D39FD3A042AULL, 0xBB5B7A9A47D7ED85ULL, 0x05C759507E8E333EULL}},
    {{0x26A9FFFFFFFFC71CULL, 0x1472AAA9CB8D5555ULL, 0x9A208C6B4F20A418ULL, 0x984F87ADF7AE0C7FULL, 0x32126FCED787C88FULL, 0x11560BF17BAA99BCULL},
     {0x9354FFFFFFFFE38FULL, 0x0A395554E5C6AAAAULL, 0xCD104635A790520CULL, 0xCC27C3D6FBD7063FULL, 0x190937E76BC3E447ULL, 0x08AB05F8BDD54CDEULL}},
    {{0xE1B371C71C718B10ULL, 0x4E79097A56DC4BD9ULL, 0xB0E977C69AA27452ULL, 0x761B0F37A1E26286ULL, 0xFBF7043DE3811AD0ULL, 0x124C9AD43B6CF79BULL},
     {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}},
};
static const uint64_t ISO_G2_YDEN[4][2][BFP_LIMBS] = {
    {{0xB9FEFFFFFFFFA8FBULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL},
     {0xB9FEFFFFFFFFA8FBULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}},
    {{0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0xB9FEFFFFFFFFA9D3ULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}},
    {{0x0000000000000012ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0xB9FEFFFFFFFFAA99ULL, 0x1EABFFFEB153FFFFULL, 0x6730D2A0F6B0F624ULL, 0x64774B84F38512BFULL, 0x4B1BA7B6434BACD7ULL, 0x1A0111EA397FE69AULL}},
    {{0x0000000000000001ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL},
     {0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL, 0x0000000000000000ULL}},
};

/** RFC 9380 sgn0 for Fp: the low bit of the canonical representative. */
static int bfp_sgn0(bfp a) {
  uint64_t plain[BFP_LIMBS];
  bfp_from_mont(a, plain);
  return (int)(plain[0] & 1);
}

/** RFC 9380 sgn0_m_eq_2: c0's sign, falling back to c1's when c0 is zero. */
static int fp2_sgn0(fp2 a) {
  const int s0 = bfp_sgn0(a.c0);
  return s0 | (bfp_is_zero(a.c0) & bfp_sgn0(a.c1));
}

static int bfp_is_square(bfp a) {
  if (bfp_is_zero(a)) return 1;
  return bfp_eq(bfp_pow(a, BLS_EULER_EXP, BFP_LIMBS), bfp_one());
}

/** A square root in Fp. p is 3 mod 4, so it is a single exponentiation. */
static inline bfp bfp_sqrt(bfp a) { return bfp_pow(a, BLS_SQRT_EXP, BFP_LIMBS); }

/**
 * A square root in Fp2, by the norm method.
 *
 * For `a = a0 + a1 i` the norm `a0^2 + a1^2` is a square in Fp exactly when `a`
 * is a square in Fp2, and its root `s` splits the problem back into Fp:
 * `(a0 ± s)/2` is the square of the root's real part. Returns 0 when `a` is not
 * a square, which the SWU map relies on to choose between its two candidates.
 */
static int fp2_sqrt(fp2 a, fp2 *out) {
  if (fp2_is_zero(a)) {
    *out = FP2_ZERO;
    return 1;
  }
  if (bfp_is_zero(a.c1)) {
    // Purely real: the root is real if a0 is a square, imaginary otherwise,
    // since -1 is the non-residue this tower is built on.
    if (bfp_is_square(a.c0)) {
      *out = (fp2){bfp_sqrt(a.c0), BFP_ZERO};
      return 1;
    }
    const bfp r = bfp_sqrt(bfp_neg(a.c0));
    if (!bfp_eq(bfp_sqr(r), bfp_neg(a.c0))) return 0;
    *out = (fp2){BFP_ZERO, r};
    return 1;
  }
  const bfp norm = bfp_add(bfp_sqr(a.c0), bfp_sqr(a.c1));
  if (!bfp_is_square(norm)) return 0;
  const bfp s = bfp_sqrt(norm);
  bfp t = bfp_half(bfp_add(a.c0, s));
  if (!bfp_is_square(t)) t = bfp_half(bfp_sub(a.c0, s));
  if (!bfp_is_square(t)) return 0;
  const bfp x0 = bfp_sqrt(t);
  if (bfp_is_zero(x0)) return 0;
  const bfp x1 = bfp_mul(a.c1, bfp_inv(bfp_add(x0, x0)));
  *out = (fp2){x0, x1};
  return bfp_eq(bfp_sub(bfp_sqr(x0), bfp_sqr(x1)), a.c0);
}

static inline int fp2_is_square(fp2 a) {
  fp2 ignored;
  return fp2_sqrt(a, &ignored);
}

/**
 * The simplified SWU map for G1's isogenous curve E' (RFC 9380 section 6.6.2,
 * the branch where A and B are both nonzero).
 *
 * Both candidate abscissae are formed and the square one is taken, rather than
 * going through the RFC's `sqrt_ratio`. The two agree, and this way the only
 * primitives needed are a square test and a square root — no `cmov`, and no
 * second exponentiation chain to get wrong.
 */
static void swu_g1(bfp u, bfp *xout, bfp *yout) {
  const bfp A = bfp_to_mont(SWU_G1_A), B = bfp_to_mont(SWU_G1_B);
  const bfp tv1 = bfp_mul(bfp_to_mont(SWU_G1_Z), bfp_sqr(u));
  const bfp tv2 = bfp_sqr(tv1);
  const bfp d = bfp_add(tv1, tv2);
  // A vanishing denominator is the one input the map has to special-case; the
  // RFC substitutes 1/Z, which sends it to a fixed point of E'.
  bfp x1 = bfp_is_zero(d) ? bfp_to_mont(SWU_G1_MZINV)
                          : bfp_add(bfp_inv(d), bfp_one());
  x1 = bfp_mul(x1, bfp_to_mont(SWU_G1_MBA));
  const bfp gx1 = bfp_add(bfp_mul(bfp_add(bfp_sqr(x1), A), x1), B);
  bfp y;
  if (bfp_is_square(gx1)) {
    y = bfp_sqrt(gx1);
    *xout = x1;
  } else {
    // g(Z u^2 x1) = Z^3 u^6 g(x1), and Z u^2 is a non-residue, so exactly one
    // of the two is square.
    y = bfp_sqrt(bfp_mul(gx1, bfp_mul(tv1, tv2)));
    *xout = bfp_mul(tv1, x1);
  }
  *yout = bfp_sgn0(u) == bfp_sgn0(y) ? y : bfp_neg(y);
}

/** The same map over Fp2, for G2's isogenous curve. */
static int swu_g2(fp2 u, fp2 *xout, fp2 *yout) {
  const fp2 A = fp2_from_raw(SWU_G2_A), B = fp2_from_raw(SWU_G2_B);
  const fp2 tv1 = fp2_mul(fp2_from_raw(SWU_G2_Z), fp2_sqr(u));
  const fp2 tv2 = fp2_sqr(tv1);
  const fp2 d = fp2_add(tv1, tv2);
  fp2 x1 = fp2_is_zero(d) ? fp2_from_raw(SWU_G2_MZINV)
                          : fp2_add(fp2_inv(d), fp2_one());
  x1 = fp2_mul(x1, fp2_from_raw(SWU_G2_MBA));
  const fp2 gx1 = fp2_add(fp2_mul(fp2_add(fp2_sqr(x1), A), x1), B);
  fp2 y;
  if (fp2_sqrt(gx1, &y)) {
    *xout = x1;
  } else {
    if (!fp2_sqrt(fp2_mul(gx1, fp2_mul(tv1, tv2)), &y)) return 0;
    *xout = fp2_mul(tv1, x1);
  }
  *yout = fp2_sgn0(u) == fp2_sgn0(y) ? y : fp2_neg(y);
  return 1;
}

/** Horner evaluation of one isogeny polynomial over Fp, highest term first. */
static bfp iso_poly_g1(const uint64_t c[][BFP_LIMBS], int n, bfp x) {
  bfp acc = bfp_to_mont(c[n - 1]);
  for (int i = n - 2; i >= 0; i--)
    acc = bfp_add(bfp_mul(acc, x), bfp_to_mont(c[i]));
  return acc;
}

static fp2 iso_poly_g2(const uint64_t c[][2][BFP_LIMBS], int n, fp2 x) {
  fp2 acc = fp2_from_raw(c[n - 1]);
  for (int i = n - 2; i >= 0; i--)
    acc = fp2_add(fp2_mul(acc, x), fp2_from_raw(c[i]));
  return acc;
}

/** The 11-isogeny carrying a point on E' across to G1's curve. */
static void iso_map_g1(bfp x, bfp y, bg1 *out) {
  const bfp xn = iso_poly_g1(ISO_G1_XNUM, 12, x);
  const bfp xd = iso_poly_g1(ISO_G1_XDEN, 11, x);
  const bfp yn = iso_poly_g1(ISO_G1_YNUM, 16, x);
  const bfp yd = iso_poly_g1(ISO_G1_YDEN, 16, x);
  if (bfp_is_zero(xd) || bfp_is_zero(yd)) {
    *out = bg1_inf();
    return;
  }
  out->x = bfp_mul(xn, bfp_inv(xd));
  out->y = bfp_mul(y, bfp_mul(yn, bfp_inv(yd)));
  out->z = bfp_one();
}

/** The 3-isogeny, likewise for G2. */
static void iso_map_g2(fp2 x, fp2 y, bg2 *out) {
  const fp2 xn = iso_poly_g2(ISO_G2_XNUM, 4, x);
  const fp2 xd = iso_poly_g2(ISO_G2_XDEN, 3, x);
  const fp2 yn = iso_poly_g2(ISO_G2_YNUM, 4, x);
  const fp2 yd = iso_poly_g2(ISO_G2_YDEN, 4, x);
  if (fp2_is_zero(xd) || fp2_is_zero(yd)) {
    *out = bg2_inf();
    return;
  }
  out->x = fp2_mul(xn, fp2_inv(xd));
  out->y = fp2_mul(y, fp2_mul(yn, fp2_inv(yd)));
  out->z = fp2_one();
}

// The BLS parameter, |x|. The curve is built with -x, so a multiplication by
// this must be negated wherever the formula calls for [x].
static const uint64_t BLS_X_ABS[1] = {0xD201000000010000ULL};

/**
 * Clears G1's cofactor: `[x]P + P`, which is `[h_eff]P` for `h_eff = x + 1`
 * (eprint 2019/403). Multiplying by the full cofactor would work too and is
 * several times slower.
 */
static void bg1_clear_cofactor(bg1 *p) {
  bg1 xp;
  bg1_mul(&xp, p, BLS_X_ABS, 1);
  bg1 sum;
  bg1_add(&sum, &xp, p);
  *p = sum;
}

static inline void bg2_neg(bg2 *p) { p->y = fp2_neg(p->y); }

/** psi, the untwist-Frobenius-twist endomorphism, on an affine-ised point. */
static void bg2_psi(bg2 *p) {
  fp2 x, y;
  bg2_affine(p, &x, &y);
  p->x = fp2_mul(fp2_conj(x), fp2_from_raw(BLS_PSI_X));
  p->y = fp2_mul(fp2_conj(y), fp2_from_raw(BLS_PSI_Y));
  p->z = fp2_one();
}

/** psi squared, which only scales x and negates y. */
static void bg2_psi2(bg2 *p) {
  fp2 x, y;
  bg2_affine(p, &x, &y);
  p->x = fp2_mul(x, fp2_from_raw(BLS_PSI2_X));
  p->y = fp2_neg(y);
  p->z = fp2_one();
}

/**
 * Clears G2's cofactor by the Budroni-Pintore map (eprint 2017/419), which
 * RFC 9380 names `clear_cofactor_bls12381_g2`:
 *
 *     [x^2 - x - 1]P + [x - 1]psi(P) + psi^2([2]P)
 *
 * G2's cofactor is over 500 bits, so multiplying by it directly would cost
 * more than the pairing this precompile exists to feed.
 */
static void bg2_clear_cofactor(bg2 *p) {
  bg2 t1; // [-x]P
  bg2_mul(&t1, p, BLS_X_ABS, 1);
  bg2_neg(&t1);

  bg2 t2 = *p; // psi(P)
  if (!bg2_is_inf(&t2)) bg2_psi(&t2);

  bg2 t3;
  bg2_double(&t3, p); // psi^2([2]P)
  if (!bg2_is_inf(&t3)) bg2_psi2(&t3);

  bg2 neg = t2, acc;
  bg2_neg(&neg);
  bg2_add(&acc, &t3, &neg); // psi^2([2]P) - psi(P)
  t3 = acc;

  bg2_add(&acc, &t1, &t2); // [-x]P + psi(P)
  bg2_mul(&t2, &acc, BLS_X_ABS, 1);
  bg2_neg(&t2); // [x^2]P - [x]psi(P)

  bg2_add(&acc, &t3, &t2);
  t3 = acc;
  neg = t1;
  bg2_neg(&neg);
  bg2_add(&acc, &t3, &neg); // ... + [x]P
  t3 = acc;
  neg = *p;
  bg2_neg(&neg);
  bg2_add(p, &t3, &neg); // ... - P
}

/** EIP-2537 precompile 0x10: a field element to a point of G1. */
static void bls_map_fp_to_g1(bfp u, bg1 *out) {
  bfp x, y;
  swu_g1(u, &x, &y);
  iso_map_g1(x, y, out);
  bg1_clear_cofactor(out);
}

/** EIP-2537 precompile 0x11: an Fp2 element to a point of G2. */
static int bls_map_fp2_to_g2(fp2 u, bg2 *out) {
  fp2 x, y;
  if (!swu_g2(u, &x, &y)) return 0;
  iso_map_g2(x, y, out);
  bg2_clear_cofactor(out);
  return 1;
}

#endif // OX_EVM_BLS12381_H
