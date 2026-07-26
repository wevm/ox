// secp256r1 (NIST P-256) ECDSA verification, for the P256VERIFY precompile
// (EIP-7951, address 0x0100, Osaka).
//
// This is verification only, so unlike `secp256k1.h` there is nothing to
// recover and no public key to reconstruct: the key arrives in the calldata
// and the job is to check one signature against it.
//
// Two choices differ from the secp256k1 implementation next door, both because
// the curve differs rather than by preference:
//
//   - The field is reduced by Montgomery rather than by a Solinas fold. This
//     prime is `2^256 - 2^224 + 2^192 + 2^96 - 1`, a generalised Mersenne whose
//     fast reduction is nine signed 32-bit term rearrangements — quick, and
//     far easier to get subtly wrong than the 33-bit fold secp256k1's shape
//     allows. Montgomery is the same CIOS already proven twice in this tree.
//   - The curve has `a = -3` rather than `a = 0`, so the doubling formula is
//     dbl-2001-b instead of the shorter one that assumes `a` vanishes.
//
// Inversion is `safegcd.h`, as everywhere else here.

#ifndef OX_EVM_SECP256R1_H
#define OX_EVM_SECP256R1_H

#include "safegcd.h"
#include "u256.h"

#define P256_P                                                    \
  ((u256){{0xFFFFFFFFFFFFFFFFULL, 0x00000000FFFFFFFFULL,          \
           0x0000000000000000ULL, 0xFFFFFFFF00000001ULL}})
/** The group order. Scalars are reduced modulo this, coordinates modulo p. */
#define P256_N                                                    \
  ((u256){{0xF3B9CAC2FC632551ULL, 0xBCE6FAADA7179E84ULL,          \
           0xFFFFFFFFFFFFFFFFULL, 0xFFFFFFFF00000000ULL}})

// Everything below is in Montgomery form: `x * 2^256 mod p`.
#define P256_ONE                                                  \
  ((u256){{0x0000000000000001ULL, 0xFFFFFFFF00000000ULL,          \
           0xFFFFFFFFFFFFFFFFULL, 0x00000000FFFFFFFEULL}})
#define P256_R2                                                   \
  ((u256){{0x0000000000000003ULL, 0xFFFFFFFBFFFFFFFFULL,          \
           0xFFFFFFFFFFFFFFFEULL, 0x00000004FFFFFFFDULL}})
#define P256_B                                                    \
  ((u256){{0xD89CDF6229C4BDDFULL, 0xACF005CD78843090ULL,          \
           0xE5A220ABF7212ED6ULL, 0xDC30061D04874834ULL}})
#define P256_GX                                                   \
  ((u256){{0x79E730D418A9143CULL, 0x75BA95FC5FEDB601ULL,          \
           0x79FB732B77622510ULL, 0x18905F76A53755C6ULL}})
#define P256_GY                                                   \
  ((u256){{0xDDF25357CE95560AULL, 0x8B4AB8E4BA19E45CULL,          \
           0xD2E88688DD21F325ULL, 0x8571FF1825885D85ULL}})
// -p^-1 mod 2^64. One, for this prime.
#define P256_N0 0x0000000000000001ULL

// The two moduli as five limbs of 62 bits, for `safegcd.h`.
static const int64_t SG_P256_P[5] = {
    0x3FFFFFFFFFFFFFFFLL, 0x00000003FFFFFFFFLL, 0x0000000000000000LL,
    0x3FFFFFC000000040LL, 0x00000000000000FFLL};
#define SG_P256_P_INV62 0x3FFFFFFFFFFFFFFFULL
static const int64_t SG_P256_N[5] = {
    0x33B9CAC2FC632551LL, 0x339BEAB69C5E7A13LL, 0x3FFFFFFFFFFFFFFBLL,
    0x3FFFFFC00000003FLL, 0x00000000000000FFLL};
#define SG_P256_N_INV62 0x332E375511FF43B1ULL

static const uint64_t p256_p_l[4] = {0xFFFFFFFFFFFFFFFFULL,
                                     0x00000000FFFFFFFFULL,
                                     0x0000000000000000ULL,
                                     0xFFFFFFFF00000001ULL};

/** Montgomery multiplication, coarsely integrated. See `bn254.h`. */
static inline u256 p256_mul(u256 a, u256 b) {
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

    const uint64_t m = t[0] * P256_N0;
    uint64_t lo, hi;
    mul64(m, p256_p_l[0], &lo, &hi);
    // The low word cancels by construction; only its carry survives.
    c = hi + ((t[0] + lo) < lo);
    for (int j = 1; j < 4; j++) {
      mul64(m, p256_p_l[j], &lo, &hi);
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
  if (t[4] || u256_cmp(r, P256_P) >= 0) r = u256_sub(r, P256_P);
  return r;
}

static inline u256 p256_sqr(u256 a) { return p256_mul(a, a); }
static inline u256 p256_to_mont(u256 a) { return p256_mul(a, P256_R2); }
/** Out of Montgomery form: reducing against one divides by R. */
static inline u256 p256_from_mont(u256 a) {
  return p256_mul(a, (u256){{1, 0, 0, 0}});
}

static inline u256 p256_add(u256 a, u256 b) {
  const u256 r = u256_add(a, b);
  // p is just under 2^256, so the sum can wrap; a wrap means it exceeded p.
  const int carry = u256_cmp(r, a) < 0;
  if (carry || u256_cmp(r, P256_P) >= 0) return u256_sub(r, P256_P);
  return r;
}

static inline u256 p256_sub(u256 a, u256 b) {
  if (u256_cmp(a, b) < 0) return u256_add(u256_sub(a, b), P256_P);
  return u256_sub(a, b);
}

/** `a^-1 mod p`, in Montgomery form throughout. */
static u256 p256_inv(u256 a) {
  if (u256_is_zero(a)) return U256_ZERO;
  sg62 x;
  sg_from64(&x, a.l, 4, 5);
  sg_inv(5, &x, SG_P256_P, SG_P256_P_INV62);
  u256 r;
  sg_to64(r.l, 4, &x, 5);
  // safegcd inverts the integer it is handed, so on `aR` it returns
  // `a^-1 R^-1`; a Montgomery multiply by R^3 lands on `a^-1 R`.
  return p256_mul(r, p256_mul(P256_R2, P256_R2));
}

/** `a^-1 mod n`, on ordinary integers — scalars are not in Montgomery form. */
static u256 p256_scalar_inv(u256 a) {
  if (u256_is_zero(a)) return U256_ZERO;
  sg62 x;
  sg_from64(&x, a.l, 4, 5);
  sg_inv(5, &x, SG_P256_N, SG_P256_N_INV62);
  u256 r;
  sg_to64(r.l, 4, &x, 5);
  return r;
}

/** A point in Jacobian coordinates; `z == 0` is the point at infinity. */
typedef struct {
  u256 x, y, z;
} p256_pt;

static inline int p256_is_inf(const p256_pt *p) { return u256_is_zero(p->z); }

static inline p256_pt p256_inf(void) {
  return (p256_pt){P256_ONE, P256_ONE, U256_ZERO};
}

/**
 * Doubling for `a = -3`, dbl-2001-b.
 *
 * The shorter formula secp256k1 uses drops the `a` term because that curve has
 * `a = 0`. Here `alpha = 3(X-Z^2)(X+Z^2)` is what carries it, which is exactly
 * `3X^2 + aZ^4` when `a` is `-3`.
 */
static void p256_double(p256_pt *r, const p256_pt *p) {
  if (p256_is_inf(p) || u256_is_zero(p->y)) {
    *r = p256_inf();
    return;
  }
  const u256 delta = p256_sqr(p->z);
  const u256 gamma = p256_sqr(p->y);
  const u256 beta = p256_mul(p->x, gamma);
  u256 alpha = p256_mul(p256_sub(p->x, delta), p256_add(p->x, delta));
  alpha = p256_add(p256_add(alpha, alpha), alpha);

  // X3 = alpha^2 - 8*beta, Y3 = alpha*(4*beta - X3) - 8*gamma^2.
  const u256 beta2 = p256_add(beta, beta);
  const u256 beta4 = p256_add(beta2, beta2);
  const u256 beta8 = p256_add(beta4, beta4);
  const u256 x3 = p256_sub(p256_sqr(alpha), beta8);
  u256 g2 = p256_sqr(gamma);
  g2 = p256_add(g2, g2);
  g2 = p256_add(g2, g2);
  g2 = p256_add(g2, g2); // 8 * gamma^2
  const u256 y3 = p256_sub(p256_mul(alpha, p256_sub(beta4, x3)), g2);
  const u256 z3 =
      p256_sub(p256_sub(p256_sqr(p256_add(p->y, p->z)), gamma), delta);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

/** Jacobian addition, add-2007-bl, with the doubling and infinity cases. */
static void p256_add_pt(p256_pt *r, const p256_pt *p, const p256_pt *q) {
  if (p256_is_inf(p)) {
    *r = *q;
    return;
  }
  if (p256_is_inf(q)) {
    *r = *p;
    return;
  }
  const u256 z1z1 = p256_sqr(p->z);
  const u256 z2z2 = p256_sqr(q->z);
  const u256 u1 = p256_mul(p->x, z2z2);
  const u256 u2 = p256_mul(q->x, z1z1);
  const u256 s1 = p256_mul(p256_mul(p->y, q->z), z2z2);
  const u256 s2 = p256_mul(p256_mul(q->y, p->z), z1z1);
  if (u256_eq(u1, u2)) {
    // Same x: either the same point, which doubles, or a pair that cancels.
    if (!u256_eq(s1, s2)) {
      *r = p256_inf();
      return;
    }
    p256_double(r, p);
    return;
  }
  const u256 h = p256_sub(u2, u1);
  const u256 h2 = p256_add(h, h);
  const u256 i = p256_sqr(h2);
  const u256 j = p256_mul(h, i);
  u256 rr = p256_sub(s2, s1);
  rr = p256_add(rr, rr);
  const u256 v = p256_mul(u1, i);
  u256 x3 = p256_sub(p256_sqr(rr), j);
  x3 = p256_sub(x3, p256_add(v, v));
  u256 s1j = p256_mul(s1, j);
  s1j = p256_add(s1j, s1j);
  const u256 y3 = p256_sub(p256_mul(rr, p256_sub(v, x3)), s1j);
  u256 z3 = p256_sqr(p256_add(p->z, q->z));
  z3 = p256_mul(p256_sub(p256_sub(z3, z1z1), z2z2), h);
  r->x = x3;
  r->y = y3;
  r->z = z3;
}

/** Is `(x, y)` on `y^2 = x^3 - 3x + b`? Both coordinates in Montgomery form. */
static int p256_on_curve(u256 x, u256 y) {
  const u256 lhs = p256_sqr(y);
  u256 rhs = p256_sqr(x);
  rhs = p256_sub(rhs, p256_add(P256_ONE, p256_add(P256_ONE, P256_ONE)));
  rhs = p256_mul(rhs, x);
  rhs = p256_add(rhs, P256_B);
  return u256_eq(lhs, rhs);
}

/**
 * `k1 * G + k2 * Q`, by Shamir's trick over 4-bit windows.
 *
 * One doubling chain serves both products: 64 quadruple-doublings with two
 * table lookups each, against two independent 256-step ladders. Two 16-entry
 * tables rather than one 256-entry joint table — the joint one saves 64
 * additions and costs 24 KiB of stack, which this engine does not have.
 */
static void p256_mul2(p256_pt *out, u256 k1, const p256_pt *g, u256 k2,
                      const p256_pt *q) {
  p256_pt tg[16], tq[16];
  tg[0] = p256_inf();
  tq[0] = p256_inf();
  tg[1] = *g;
  tq[1] = *q;
  for (int i = 2; i < 16; i++) {
    p256_add_pt(&tg[i], &tg[i - 1], g);
    p256_add_pt(&tq[i], &tq[i - 1], q);
  }
  p256_pt acc = p256_inf();
  for (int nib = 63; nib >= 0; nib--) {
    if (nib != 63)
      for (int d = 0; d < 4; d++) p256_double(&acc, &acc);
    const int shift = (nib % 16) * 4;
    const int limb = nib / 16;
    const int a = (int)((k1.l[limb] >> shift) & 0xf);
    const int b = (int)((k2.l[limb] >> shift) & 0xf);
    if (a) p256_add_pt(&acc, &acc, &tg[a]);
    if (b) p256_add_pt(&acc, &acc, &tq[b]);
  }
  *out = acc;
}

/**
 * ECDSA verification over secp256r1, on the 160-byte EIP-7951 input.
 *
 * Returns 1 for a valid signature and 0 for anything else — a malformed
 * encoding, an out-of-range component, a public key off the curve, or a
 * signature that simply does not check. The precompile makes no distinction
 * between those, so neither does this.
 */
static int p256_verify(const uint8_t in[160]) {
  const u256 h = u256_from_be(in);
  const u256 r = u256_from_be(in + 32);
  const u256 s = u256_from_be(in + 64);
  const u256 qx = u256_from_be(in + 96);
  const u256 qy = u256_from_be(in + 128);

  // 0 < r, s < n.
  if (u256_is_zero(r) || u256_cmp(r, P256_N) >= 0) return 0;
  if (u256_is_zero(s) || u256_cmp(s, P256_N) >= 0) return 0;
  // qx, qy < p, and not the encoding of infinity.
  if (u256_cmp(qx, P256_P) >= 0 || u256_cmp(qy, P256_P) >= 0) return 0;
  if (u256_is_zero(qx) && u256_is_zero(qy)) return 0;

  const u256 mqx = p256_to_mont(qx), mqy = p256_to_mont(qy);
  if (!p256_on_curve(mqx, mqy)) return 0;
  // The cofactor is one, so a point on the curve is already in the group and
  // no subgroup check is needed.

  const u256 sinv = p256_scalar_inv(s);
  // The hash is used as an integer modulo n, whatever 32 bytes arrived.
  const u256 z = u256_cmp(h, P256_N) >= 0 ? u256_sub(h, P256_N) : h;
  const u256 u1 = u256_mulmod(z, sinv, P256_N);
  const u256 u2 = u256_mulmod(r, sinv, P256_N);

  const p256_pt g = {P256_GX, P256_GY, P256_ONE};
  const p256_pt q = {mqx, mqy, P256_ONE};
  p256_pt pt;
  p256_mul2(&pt, u1, &g, u2, &q);
  if (p256_is_inf(&pt)) return 0;

  // Compare r against the affine x of the result, reduced modulo n. The
  // affine x is `X / Z^2`, so one inversion finishes it.
  const u256 zinv = p256_inv(pt.z);
  const u256 zinv2 = p256_sqr(zinv);
  const u256 x = p256_from_mont(p256_mul(pt.x, zinv2));
  u256 xn = x;
  // x is below p, and p is under 2n, so at most one subtraction reduces it.
  if (u256_cmp(xn, P256_N) >= 0) xn = u256_sub(xn, P256_N);
  return u256_eq(xn, r);
}

#endif // OX_EVM_SECP256R1_H
