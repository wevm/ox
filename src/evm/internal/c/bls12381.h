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

static bfp bfp_inv(bfp a) {
  // p - 2
  uint64_t e[BFP_LIMBS];
  for (int i = 0; i < BFP_LIMBS; i++) e[i] = BLS_P[i];
  e[0] -= 2;
  return bfp_pow(a, e, BFP_LIMBS);
}

// ---------------------------------------------------------------------------
// Fp2 = Fp[u] / (u^2 + 1)
// ---------------------------------------------------------------------------

typedef struct {
  bfp c0, c1;
} fp2;

#define FP2_ZERO ((fp2){BFP_ZERO, BFP_ZERO})

static inline fp2 fp2_one(void) { return (fp2){bfp_one(), BFP_ZERO}; }
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

static inline fp12 fp12_sqr(fp12 a) { return fp12_mul(a, a); }

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

static fp12 fp12_pow_limbs(fp12 a, const uint64_t *e, int n) {
  fp12 r = fp12_one();
  int started = 0;
  for (int i = n - 1; i >= 0; i--)
    for (int bit = 63; bit >= 0; bit--) {
      if (started) r = fp12_sqr(r);
      if ((e[i] >> bit) & 1) {
        r = started ? fp12_mul(r, a) : a;
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

static void bg1_mul(bg1 *out, const bg1 *p, const uint64_t *k, int n) {
  bg1 acc = bg1_inf();
  for (int i = n - 1; i >= 0; i--)
    for (int bit = 63; bit >= 0; bit--) {
      bg1 t;
      bg1_double(&t, &acc);
      acc = t;
      if ((k[i] >> bit) & 1) {
        bg1_add(&t, &acc, p);
        acc = t;
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

static void bg2_mul(bg2 *out, const bg2 *p, const uint64_t *k, int n) {
  bg2 acc = bg2_inf();
  for (int i = n - 1; i >= 0; i--)
    for (int bit = 63; bit >= 0; bit--) {
      bg2 t;
      bg2_double(&t, &acc);
      acc = t;
      if ((k[i] >> bit) & 1) {
        bg2_add(&t, &acc, p);
        acc = t;
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

// (p^4 - p^2 + 1) / r, the hard part of the final exponentiation, as one
// 1268-bit exponent.
static const uint64_t bls_hard_exp[20] = {
    0xE516C3F438E3BA79ULL, 0xFA9912AAE208CCF1ULL, 0x905CE937335D5B68ULL,
    0xC71A2629B0DEA236ULL, 0x83774940996754C8ULL, 0x21D160AEB6A1E799ULL,
    0x2ED0B283ED237DB4ULL, 0x915C97F36C6F1821ULL, 0x67F17FCBDE783765ULL,
    0x2378B9039096D1B7ULL, 0x7988F8761BDC51DCULL, 0x2076995003FC77A1ULL,
    0x827ECA0BA621315BULL, 0xE5A72BCE8D63CB9FULL, 0xF68F7764C28B6F8AULL,
    0x2F230063CF081517ULL, 0x94506632528D6A9AULL, 0xD3CDE88EEB996CA3ULL,
    0xC0BD38C3195C899EULL, 0x000F686B3D807D01ULL,
};

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
static fp12 bg2_line(const fp2 ax, const fp2 ay, const fp2 bx, const fp2 by,
                     bfp px, bfp py, int tangent) {
  fp2 slope;
  if (tangent) {
    fp2 num = fp2_sqr(ax);
    num = fp2_add(fp2_add(num, num), num);
    slope = fp2_mul(num, fp2_inv(fp2_add(ay, ay)));
  } else {
    slope = fp2_mul(fp2_sub(by, ay), fp2_inv(fp2_sub(bx, ax)));
  }
  fp12 out = (fp12){FP6_ZERO, FP6_ZERO};
  out.c0.c0 = (fp2){py, BFP_ZERO};
  out.c1.c1 = fp2_div_xi(fp2_sub(fp2_mul(slope, ax), ay));
  out.c1.c2 = fp2_div_xi(fp2_neg(fp2_mul_fp(slope, px)));
  return out;
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
    f = fp12_mul(f, bg2_line(rx, ry, rx, ry, px, py, 1));
    {
      bg2 rj = (bg2){rx, ry, fp2_one()}, t;
      bg2_double(&t, &rj);
      bg2_to_affine_xy(&t, &rx, &ry);
    }
    if ((BLS_Z >> bit) & 1) {
      f = fp12_mul(f, bg2_line(rx, ry, qx, qy, px, py, 0));
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

/** The final exponentiation, `f^((p^12 - 1) / r)`. */
static fp12 bls_final_exp(fp12 f) {
  fp12 t = fp12_mul(fp12_conj(f), fp12_inv(f));
  const fp12 t2 = fp12_frobenius(fp12_frobenius(t));
  t = fp12_mul(t, t2);
  return fp12_pow_limbs(t, bls_hard_exp, 20);
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

#endif // OX_EVM_BLS12381_H
