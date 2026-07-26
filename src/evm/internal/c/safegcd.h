// Modular inversion by Bernstein-Yang "safegcd".
//
// Every curve here inverts constantly — `bfp_inv` alone is 59% of the BLS
// G1 add precompile, and the Miller loop inverts twice per iteration — and
// the binary extended GCD it replaces is about 540 iterations of
// shift-compare-subtract over 384 bits. Two cheaper refinements of that loop
// were tried and both measured worse: Kaliski's almost-inverse at 4369 ns
// against 4084, and narrowing the loop to the live limbs of u and v at 4888.
// The loop itself is the floor, so the way past it is a different algorithm.
//
// safegcd batches 62 divsteps at a time by looking only at the low 62 bits of
// f and g — each step inspects `g & 1`, so nothing above those bits can affect
// them — and folds the batch into a 2x2 integer matrix. One pass over the full
// width then applies the matrix to (f, g) and to the Bezout pair (d, e), and
// the shift by 62 that follows means a 384-bit inversion needs roughly a dozen
// passes instead of 540.
//
// This follows libsecp256k1's `modinv64`, which is the reference for the
// 62-bit-limb formulation, in its variable-time form: every input the EVM
// precompiles invert is public calldata, and the binary GCD this replaces was
// variable-time too. The width is a runtime parameter so the 381-bit and
// 254-bit fields share one implementation; the loops are five or seven long
// either way.

#ifndef OX_EVM_SAFEGCD_H
#define OX_EVM_SAFEGCD_H

#include "u256.h" // for mul64

// Seven limbs of 62 bits covers 434, enough for the 381-bit BLS12-381 prime
// with room for the signed intermediates. The 256-bit fields pass len = 5.
#define SG_LIMBS 7
#define SG_M62 0x3FFFFFFFFFFFFFFFULL

/** A signed integer as `len` limbs of 62 bits; only the top limb is signed. */
typedef struct {
  int64_t v[SG_LIMBS];
} sg62;

// -(2i+1)^-1 mod 256, indexed by `(f >> 1) & 127`. Multiplying g by this entry
// gives, in its low bits, the multiple of f that cancels g's low bits — which
// is what a batch of divsteps needs and what makes them foldable.
static const uint8_t sg_inv256[128] = {
    0xFF, 0x55, 0x33, 0x49, 0xC7, 0x5D, 0x3B, 0x11, 0x0F, 0xE5, 0xC3, 0x59,
    0xD7, 0xED, 0xCB, 0x21, 0x1F, 0x75, 0x53, 0x69, 0xE7, 0x7D, 0x5B, 0x31,
    0x2F, 0x05, 0xE3, 0x79, 0xF7, 0x0D, 0xEB, 0x41, 0x3F, 0x95, 0x73, 0x89,
    0x07, 0x9D, 0x7B, 0x51, 0x4F, 0x25, 0x03, 0x99, 0x17, 0x2D, 0x0B, 0x61,
    0x5F, 0xB5, 0x93, 0xA9, 0x27, 0xBD, 0x9B, 0x71, 0x6F, 0x45, 0x23, 0xB9,
    0x37, 0x4D, 0x2B, 0x81, 0x7F, 0xD5, 0xB3, 0xC9, 0x47, 0xDD, 0xBB, 0x91,
    0x8F, 0x65, 0x43, 0xD9, 0x57, 0x6D, 0x4B, 0xA1, 0x9F, 0xF5, 0xD3, 0xE9,
    0x67, 0xFD, 0xDB, 0xB1, 0xAF, 0x85, 0x63, 0xF9, 0x77, 0x8D, 0x6B, 0xC1,
    0xBF, 0x15, 0xF3, 0x09, 0x87, 0x1D, 0xFB, 0xD1, 0xCF, 0xA5, 0x83, 0x19,
    0x97, 0xAD, 0x8B, 0xE1, 0xDF, 0x35, 0x13, 0x29, 0xA7, 0x3D, 0x1B, 0xF1,
    0xEF, 0xC5, 0xA3, 0x39, 0xB7, 0xCD, 0xAB, 0x01};

// A signed 128-bit accumulator. The matrix entries and the limbs are both
// bounded by 2^62, so a product needs 124 bits and a column of them needs
// 128. wasm has no `__int128` — and on the native side the pair compiles to
// the same add/adc — so it is spelled out.
typedef struct {
  uint64_t lo;
  int64_t hi;
} sg128;

/** `acc += a * b`, signed. */
static inline void sg128_madd(sg128 *acc, int64_t a, int64_t b) {
  uint64_t lo, hi;
  mul64((uint64_t)a, (uint64_t)b, &lo, &hi);
  // `mul64` computed (a + 2^64[a<0])(b + 2^64[b<0]); subtract what the sign
  // bits added.
  if (a < 0) hi -= (uint64_t)b;
  if (b < 0) hi -= (uint64_t)a;
  const uint64_t s = acc->lo + lo;
  acc->hi = (int64_t)((uint64_t)acc->hi + hi + (s < acc->lo));
  acc->lo = s;
}

/** The 62 bits the next limb takes. */
static inline uint64_t sg128_low62(const sg128 *a) { return a->lo & SG_M62; }

/** `acc >>= 62`, arithmetic. */
static inline void sg128_shr62(sg128 *a) {
  a->lo = (a->lo >> 62) | ((uint64_t)a->hi << 2);
  a->hi >>= 62;
}

/**
 * Runs 62 divsteps on the low bits of `f` and `g`, returning them as a matrix.
 *
 * `eta` is the difference in the two operands' notional degrees, carried
 * across batches; it decides which of f and g is swapped. Nothing above bit 62
 * can influence the batch, because each divstep branches only on `g & 1` and
 * shifts g right.
 *
 * On return `t` holds `[u, v; q, r]` with every entry bounded by 2^62, such
 * that `(u f + v g) / 2^62` and `(q f + r g) / 2^62` are the state after the
 * batch. Both quotients are exact.
 */
static int64_t sg_divsteps62(int64_t eta, uint64_t f0, uint64_t g0,
                             int64_t t[4]) {
  uint64_t u = 1, v = 0, q = 0, r = 1;
  uint64_t f = f0, g = g0, m;
  int i = 62;
  for (;;) {
    // Trailing zeros of g, but never more than the batch has left. The
    // sentinel bit at position `i` stops the count there without a branch.
    const int zeros =
        __builtin_ctzll(g | (i == 64 ? 0 : (~(uint64_t)0 << i)));
    g >>= zeros;
    u <<= zeros;
    v <<= zeros;
    eta -= zeros;
    i -= zeros;
    if (i == 0) break;
    if (eta < 0) {
      // g outranks f, so they swap and g is negated to keep f odd.
      uint64_t tmp;
      eta = -eta;
      tmp = f, f = g, g = (uint64_t)0 - tmp;
      tmp = u, u = q, q = (uint64_t)0 - tmp;
      tmp = v, v = r, r = (uint64_t)0 - tmp;
    }
    // Cancel as many of g's low bits as this batch and `eta` allow, capped at
    // six because the table inverts modulo 256.
    const int limit = ((int)eta + 1) > i ? i : ((int)eta + 1);
    m = (~(uint64_t)0 >> (64 - limit)) & 63U;
    const uint64_t w = (g * sg_inv256[(f >> 1) & 127]) & m;
    g += f * w;
    q += u * w;
    r += v * w;
  }
  t[0] = (int64_t)u;
  t[1] = (int64_t)v;
  t[2] = (int64_t)q;
  t[3] = (int64_t)r;
  return eta;
}

/** `(f, g) <- ((u f + v g) / 2^62, (q f + r g) / 2^62)`. */
static void sg_update_fg(int len, sg62 *f, sg62 *g, const int64_t t[4]) {
  const int64_t u = t[0], v = t[1], q = t[2], r = t[3];
  sg128 cf = {0, 0}, cg = {0, 0};
  sg128_madd(&cf, u, f->v[0]);
  sg128_madd(&cf, v, g->v[0]);
  sg128_madd(&cg, q, f->v[0]);
  sg128_madd(&cg, r, g->v[0]);
  // The batch guarantees these low 62 bits are zero, so they are dropped
  // rather than stored.
  sg128_shr62(&cf);
  sg128_shr62(&cg);
  for (int i = 1; i < len; i++) {
    sg128_madd(&cf, u, f->v[i]);
    sg128_madd(&cf, v, g->v[i]);
    sg128_madd(&cg, q, f->v[i]);
    sg128_madd(&cg, r, g->v[i]);
    f->v[i - 1] = (int64_t)sg128_low62(&cf);
    sg128_shr62(&cf);
    g->v[i - 1] = (int64_t)sg128_low62(&cg);
    sg128_shr62(&cg);
  }
  f->v[len - 1] = (int64_t)cf.lo;
  g->v[len - 1] = (int64_t)cg.lo;
}

/**
 * The same matrix applied to the Bezout pair, modulo `mod`.
 *
 * `(u d + v e)` need not be divisible by 2^62 the way `(u f + v g)` is, so a
 * multiple of the modulus is added first to make it so — the Montgomery
 * trick, one limb at a time. `mod_inv62` is `mod^-1 mod 2^62`, which is what
 * turns "what must be added" into a multiplication.
 */
static void sg_update_de(int len, sg62 *d, sg62 *e, const int64_t t[4],
                         const int64_t *mod, uint64_t mod_inv62) {
  const int64_t u = t[0], v = t[1], q = t[2], r = t[3];
  // d and e are kept in (-mod, mod); a negative one is brought positive by
  // folding the modulus into the same multiple that is about to be added.
  const int64_t sd = d->v[len - 1] >> 63, se = e->v[len - 1] >> 63;
  int64_t md = (u & sd) + (v & se), me = (q & sd) + (r & se);
  sg128 cd = {0, 0}, ce = {0, 0};
  sg128_madd(&cd, u, d->v[0]);
  sg128_madd(&cd, v, e->v[0]);
  sg128_madd(&ce, q, d->v[0]);
  sg128_madd(&ce, r, e->v[0]);
  md -= (int64_t)((mod_inv62 * sg128_low62(&cd) + (uint64_t)md) & SG_M62);
  me -= (int64_t)((mod_inv62 * sg128_low62(&ce) + (uint64_t)me) & SG_M62);
  sg128_madd(&cd, mod[0], md);
  sg128_madd(&ce, mod[0], me);
  sg128_shr62(&cd);
  sg128_shr62(&ce);
  for (int i = 1; i < len; i++) {
    sg128_madd(&cd, u, d->v[i]);
    sg128_madd(&cd, v, e->v[i]);
    sg128_madd(&ce, q, d->v[i]);
    sg128_madd(&ce, r, e->v[i]);
    sg128_madd(&cd, mod[i], md);
    sg128_madd(&ce, mod[i], me);
    d->v[i - 1] = (int64_t)sg128_low62(&cd);
    sg128_shr62(&cd);
    e->v[i - 1] = (int64_t)sg128_low62(&ce);
    sg128_shr62(&ce);
  }
  d->v[len - 1] = (int64_t)cd.lo;
  e->v[len - 1] = (int64_t)ce.lo;
}

/** Brings `r` into `[0, mod)`, negating it first when `sign` is negative. */
static void sg_normalize(int len, sg62 *r, int64_t sign, const int64_t *mod) {
  int64_t cond_add = r->v[len - 1] >> 63;
  for (int i = 0; i < len; i++) r->v[i] += mod[i] & cond_add;
  const int64_t cond_neg = sign >> 63;
  for (int i = 0; i < len; i++) r->v[i] = (r->v[i] ^ cond_neg) - cond_neg;
  for (int i = 0; i < len - 1; i++) {
    r->v[i + 1] += r->v[i] >> 62;
    r->v[i] &= (int64_t)SG_M62;
  }
  // Negating can leave it negative again, and the carry pass can too.
  cond_add = r->v[len - 1] >> 63;
  for (int i = 0; i < len; i++) r->v[i] += mod[i] & cond_add;
  for (int i = 0; i < len - 1; i++) {
    r->v[i + 1] += r->v[i] >> 62;
    r->v[i] &= (int64_t)SG_M62;
  }
}

/**
 * `m^-1 mod 2^62`, from the modulus' low 62-bit limb.
 *
 * For a modulus fixed at compile time this is a constant; secp256k1 inverts
 * modulo the field prime and the group order through one entry point, so it is
 * derived instead. Newton doubles the correct bits each step and an odd `m` is
 * already its own inverse to three, so five steps cover 64.
 */
static inline uint64_t sg_modinv62(uint64_t m0) {
  uint64_t x = m0;
  for (int i = 0; i < 5; i++) x *= 2 - m0 * x;
  return x & SG_M62;
}

/** Repacks `n64` limbs of 64 bits into `len` limbs of 62. */
static void sg_from64(sg62 *r, const uint64_t *a, int n64, int len) {
  for (int i = 0, bit = 0; i < len; i++, bit += 62) {
    const int lw = bit >> 6, sh = bit & 63;
    uint64_t w = lw < n64 ? a[lw] >> sh : 0;
    if (sh && lw + 1 < n64) w |= a[lw + 1] << (64 - sh);
    r->v[i] = (int64_t)(w & SG_M62);
  }
}

/** And back. `r` must be zeroed by the caller's use of it. */
static void sg_to64(uint64_t *r, int n64, const sg62 *a, int len) {
  for (int i = 0; i < n64; i++) r[i] = 0;
  for (int i = 0, bit = 0; i < len; i++, bit += 62) {
    const uint64_t w = (uint64_t)a->v[i];
    const int lw = bit >> 6, sh = bit & 63;
    if (lw < n64) r[lw] |= w << sh;
    if (sh && lw + 1 < n64) r[lw + 1] |= w >> (64 - sh);
  }
}

/**
 * `x <- x^-1 mod mod`, for `x` in `[0, mod)` and `mod` an odd prime.
 *
 * Zero inverts to zero, matching what the field wrappers promise their
 * callers. The loop runs until `g` reaches zero rather than for the
 * `(49d+80)/17` divsteps the constant-time formulation needs: getting that
 * bound wrong fails only for adversarially chosen inputs, which neither random
 * testing nor conformance would catch, and terminating on the real condition
 * costs nothing here.
 */
static void sg_inv(int len, sg62 *x, const int64_t *mod, uint64_t mod_inv62) {
  sg62 d, e, f, g = *x;
  for (int i = 0; i < len; i++) {
    d.v[i] = 0;
    e.v[i] = 0;
    f.v[i] = mod[i];
  }
  e.v[0] = 1;
  int64_t eta = -1;
  int flen = len;
  for (;;) {
    int64_t t[4];
    eta = sg_divsteps62(eta, (uint64_t)f.v[0], (uint64_t)g.v[0], t);
    sg_update_de(len, &d, &e, t, mod, mod_inv62);
    sg_update_fg(flen, &f, &g, t);
    if (g.v[0] == 0) {
      int64_t acc = 0;
      for (int j = 1; j < flen; j++) acc |= g.v[j];
      if (acc == 0) break;
    }
    // Once the top limbs of both f and g are pure sign extension they carry no
    // information, so the remaining passes can be one limb shorter. This is
    // where most of the variable-time saving comes from: f and g shrink by 62
    // bits every pass or two while d and e stay full width.
    const int64_t fn = f.v[flen - 1], gn = g.v[flen - 1];
    int64_t cond = ((int64_t)flen - 2) >> 63;
    cond |= fn ^ (fn >> 63);
    cond |= gn ^ (gn >> 63);
    if (cond == 0) {
      f.v[flen - 2] |= (int64_t)((uint64_t)fn << 62);
      g.v[flen - 2] |= (int64_t)((uint64_t)gn << 62);
      flen--;
    }
  }
  // f is now the gcd, which for a prime modulus is +-1; its sign is the sign
  // the accumulated d carries.
  sg_normalize(len, &d, f.v[flen - 1], mod);
  *x = d;
}

#endif // OX_EVM_SAFEGCD_H
