// 256-bit word arithmetic for the Ox EVM.
//
// Words are four 64-bit limbs, least-significant first. This layout maps
// directly onto wasm i64 locals and onto x86-64/aarch64 registers, and lets
// the byte-order conversions at the ABI boundary be plain 64-bit swaps.
//
// Division and the 512-bit intermediates required by MULMOD share one Knuth
// algorithm-D implementation over 64-bit limbs (`divmod_knuth64`), so there is
// a single code path to get right. It needs no 128-bit divide, only 64x64->128
// multiplies and a 2-by-1 division step, which keeps wasm32 on the same code.

#ifndef OX_EVM_U256_H
#define OX_EVM_U256_H

// Freestanding: no <stdint.h>, so the fixed-width types are declared here.
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long long uint64_t;
typedef signed char int8_t;
typedef short int16_t;
typedef int int32_t;
typedef long long int64_t;

// x86-64 and aarch64 have 64x64->128 multiply and 128/64 divide as single
// instructions, reachable through `__int128`. wasm32 *defines*
// `__SIZEOF_INT128__` but has neither: LLVM lowers those operations to
// `__multi3`/`__udivti3` libcalls that do not exist in a freestanding build. So
// gate on having the hardware, not on the type existing.
//
// Define `OX_NO_INT128` to force the portable path on a native target. That is
// how the wasm code paths get differential-tested against the native ones
// without a wasm runtime in the loop.
#if defined(__SIZEOF_INT128__) && !defined(__wasm__) && !defined(OX_NO_INT128)
#define OX_HAS_INT128 1
#endif

typedef struct {
  uint64_t l[4];
} u256;

#define U256_ZERO ((u256){{0, 0, 0, 0}})
#define U256_ONE ((u256){{1, 0, 0, 0}})

static inline int u256_is_zero(u256 a) {
  return (a.l[0] | a.l[1] | a.l[2] | a.l[3]) == 0;
}

static inline int u256_eq(u256 a, u256 b) {
  return a.l[0] == b.l[0] && a.l[1] == b.l[1] && a.l[2] == b.l[2] &&
         a.l[3] == b.l[3];
}

/** Unsigned comparison. Returns -1, 0, or 1. */
static inline int u256_cmp(u256 a, u256 b) {
  for (int i = 3; i >= 0; i--) {
    if (a.l[i] != b.l[i]) return a.l[i] < b.l[i] ? -1 : 1;
  }
  return 0;
}

static inline int u256_sign(u256 a) { return (int)(a.l[3] >> 63); }

static inline u256 u256_from_u64(uint64_t v) {
  return (u256){{v, 0, 0, 0}};
}

/** Saturates to UINT64_MAX so gas/offset callers can range-check cheaply. */
static inline uint64_t u256_to_u64_sat(u256 a) {
  if (a.l[1] | a.l[2] | a.l[3]) return ~(uint64_t)0;
  return a.l[0];
}

static inline u256 u256_not(u256 a) {
  return (u256){{~a.l[0], ~a.l[1], ~a.l[2], ~a.l[3]}};
}

static inline u256 u256_and(u256 a, u256 b) {
  return (u256){{a.l[0] & b.l[0], a.l[1] & b.l[1], a.l[2] & b.l[2],
                 a.l[3] & b.l[3]}};
}

static inline u256 u256_or(u256 a, u256 b) {
  return (u256){{a.l[0] | b.l[0], a.l[1] | b.l[1], a.l[2] | b.l[2],
                 a.l[3] | b.l[3]}};
}

static inline u256 u256_xor(u256 a, u256 b) {
  return (u256){{a.l[0] ^ b.l[0], a.l[1] ^ b.l[1], a.l[2] ^ b.l[2],
                 a.l[3] ^ b.l[3]}};
}

static inline u256 u256_add(u256 a, u256 b) {
  u256 r;
  uint64_t carry = 0;
  for (int i = 0; i < 4; i++) {
    uint64_t s = a.l[i] + b.l[i];
    uint64_t c1 = s < a.l[i];
    uint64_t t = s + carry;
    carry = c1 | (t < s);
    r.l[i] = t;
  }
  return r;
}

static inline u256 u256_sub(u256 a, u256 b) {
  u256 r;
  uint64_t borrow = 0;
  for (int i = 0; i < 4; i++) {
    uint64_t d = a.l[i] - b.l[i];
    uint64_t b1 = a.l[i] < b.l[i];
    uint64_t t = d - borrow;
    borrow = b1 | (d < borrow);
    r.l[i] = t;
  }
  return r;
}

static inline u256 u256_neg(u256 a) { return u256_add(u256_not(a), U256_ONE); }

/** 64x64 -> 128 product. */
static inline void mul64(uint64_t a, uint64_t b, uint64_t *lo, uint64_t *hi) {
#ifdef OX_HAS_INT128
  const unsigned __int128 p = (unsigned __int128)a * b;
  *lo = (uint64_t)p;
  *hi = (uint64_t)(p >> 64);
#else
  // wasm32 has no 64x64->128, so decompose into four 32x32 products.
  uint64_t a0 = a & 0xffffffffULL, a1 = a >> 32;
  uint64_t b0 = b & 0xffffffffULL, b1 = b >> 32;
  uint64_t p00 = a0 * b0;
  uint64_t p01 = a0 * b1;
  uint64_t p10 = a1 * b0;
  uint64_t p11 = a1 * b1;
  uint64_t mid = (p00 >> 32) + (p01 & 0xffffffffULL) + (p10 & 0xffffffffULL);
  *lo = (mid << 32) | (p00 & 0xffffffffULL);
  *hi = p11 + (p01 >> 32) + (p10 >> 32) + (mid >> 32);
#endif
}

/** Full 256x256 -> 512 product. `out` receives 8 limbs, least-significant first. */
static inline void u256_mul_full(u256 a, u256 b, uint64_t out[8]) {
  for (int i = 0; i < 8; i++) out[i] = 0;
  for (int i = 0; i < 4; i++) {
    uint64_t carry = 0;
    for (int j = 0; j < 4; j++) {
      uint64_t lo, hi;
      mul64(a.l[i], b.l[j], &lo, &hi);
      uint64_t s = out[i + j] + lo;
      hi += (s < lo);
      uint64_t t = s + carry;
      hi += (t < s);
      out[i + j] = t;
      carry = hi;
    }
    out[i + 4] += carry;
  }
}

/**
 * Wrapping 256-bit product (the MUL opcode).
 *
 * Only the low four limbs survive, so the partial products that land entirely
 * above limb 3 are never computed: ten 64x64 multiplies instead of the sixteen
 * a full 512-bit product needs.
 */
static inline u256 u256_mul(u256 a, u256 b) {
  u256 r = U256_ZERO;
  for (int i = 0; i < 4; i++) {
    uint64_t carry = 0;
    for (int j = 0; i + j < 4; j++) {
      uint64_t lo, hi;
      mul64(a.l[i], b.l[j], &lo, &hi);
      uint64_t s = r.l[i + j] + lo;
      hi += (s < lo);
      uint64_t t = s + carry;
      hi += (t < s);
      r.l[i + j] = t;
      carry = hi;
    }
  }
  return r;
}

// The limb displacement is a switch over the four possible values rather than
// a loop whose trip count is the shift, so nothing goes through memory. The
// zero-bit case returns early: `x >> 64` is undefined, and branching on it once
// beats folding it into every limb.

static inline u256 u256_shl(u256 a, uint32_t n) {
  if (n >= 256) return U256_ZERO;
  const uint32_t bits = n & 63;
  uint64_t w0 = 0, w1 = 0, w2 = 0, w3 = 0;
  switch (n >> 6) {
    case 0: w0 = a.l[0]; w1 = a.l[1]; w2 = a.l[2]; w3 = a.l[3]; break;
    case 1: w1 = a.l[0]; w2 = a.l[1]; w3 = a.l[2]; break;
    case 2: w2 = a.l[0]; w3 = a.l[1]; break;
    default: w3 = a.l[0]; break;
  }
  if (!bits) return (u256){{w0, w1, w2, w3}};
  const uint32_t inv = 64 - bits;
  return (u256){{w0 << bits, (w1 << bits) | (w0 >> inv),
                 (w2 << bits) | (w1 >> inv), (w3 << bits) | (w2 >> inv)}};
}

static inline u256 u256_shr(u256 a, uint32_t n) {
  if (n >= 256) return U256_ZERO;
  const uint32_t bits = n & 63;
  uint64_t w0 = 0, w1 = 0, w2 = 0, w3 = 0;
  switch (n >> 6) {
    case 0: w0 = a.l[0]; w1 = a.l[1]; w2 = a.l[2]; w3 = a.l[3]; break;
    case 1: w0 = a.l[1]; w1 = a.l[2]; w2 = a.l[3]; break;
    case 2: w0 = a.l[2]; w1 = a.l[3]; break;
    default: w0 = a.l[3]; break;
  }
  if (!bits) return (u256){{w0, w1, w2, w3}};
  const uint32_t inv = 64 - bits;
  return (u256){{(w0 >> bits) | (w1 << inv), (w1 >> bits) | (w2 << inv),
                 (w2 >> bits) | (w3 << inv), w3 >> bits}};
}

/** Arithmetic (sign-propagating) right shift. */
static inline u256 u256_sar(u256 a, uint32_t n) {
  int neg = u256_sign(a);
  if (n >= 256) return neg ? u256_not(U256_ZERO) : U256_ZERO;
  u256 r = u256_shr(a, n);
  if (neg) r = u256_or(r, u256_shl(u256_not(U256_ZERO), 256 - n));
  return r;
}

// ---------------------------------------------------------------------------
// Knuth algorithm D over 32-bit halves.
//
// Shared by DIV/MOD (4-limb numerator) and MULMOD (8-limb numerator), which is
// why it takes limb counts rather than fixed-width structs.
// ---------------------------------------------------------------------------


/**
 * Divides `(u1:u0)` by a normalized `d` using only 64-bit arithmetic.
 *
 * Hacker's Delight's `divlu` as two 32-bit steps. Requires the top bit of `d`
 * set and `u1 < d`. wasm32 has no 128-bit divide, and the reciprocal form above
 * needs one to build its reciprocal, so this covers that target.
 */
static inline uint64_t div_2by1_portable(uint64_t u1, uint64_t u0, uint64_t d,
                                         uint64_t *rem) {
  const uint64_t b = 1ULL << 32;
  const uint64_t vn1 = d >> 32, vn0 = d & 0xFFFFFFFFULL;
  const uint64_t un1 = u0 >> 32, un0 = u0 & 0xFFFFFFFFULL;
  uint64_t q1 = u1 / vn1;
  uint64_t rhat = u1 - q1 * vn1;
  while (q1 >= b || q1 * vn0 > b * rhat + un1) {
    q1--;
    rhat += vn1;
    if (rhat >= b) break;
  }
  const uint64_t un21 = u1 * b + un1 - q1 * d;
  uint64_t q0 = un21 / vn1;
  rhat = un21 - q0 * vn1;
  while (q0 >= b || q0 * vn0 > b * rhat + un0) {
    q0--;
    rhat += vn1;
    if (rhat >= b) break;
  }
  *rem = un21 * b + un0 - q0 * d;
  return q1 * b + q0;
}

/**
 * Möller-Granlund reciprocal for a normalized divisor: `floor((2^128-1)/d) -
 * 2^64`, which is exactly the low 64 bits of that quotient.
 *
 * Requires the top bit of `d` to be set. On wasm32 there is no 128-by-64
 * divide, so the same value comes out of the portable 2-by-1 step: dividing
 * `(~0 - d : ~0)` by `d` is `(2^128 - 1)/d - 2^64` by construction, and the
 * normalization makes `~0 - d < d` so the precondition holds.
 */
static inline uint64_t reciprocal_2by1(uint64_t d) {
#ifdef OX_HAS_INT128
  return (uint64_t)(~(unsigned __int128)0 / d);
#else
  uint64_t rem;
  return div_2by1_portable(~(uint64_t)0 - d, ~(uint64_t)0, d, &rem);
#endif
}

#ifdef OX_HAS_INT128

/**
 * Divides `(u1:u0)` by a normalized `d` given its reciprocal, using two
 * multiplies in place of a hardware divide.
 *
 * x86-64's 64-bit `div` is data dependent — roughly 30 cycles for small
 * operands and 90 for large ones — so a chain of them dominates any wide
 * division. This is Möller-Granlund algorithm 4, which is what `ruint` uses.
 */
static inline uint64_t div_2by1(uint64_t u1, uint64_t u0, uint64_t d,
                                uint64_t v, uint64_t *rem) {
  unsigned __int128 q = (unsigned __int128)v * u1;
  q += ((unsigned __int128)u1 << 64) | u0;
  uint64_t q1 = (uint64_t)(q >> 64) + 1;
  uint64_t q0 = (uint64_t)q;
  uint64_t r = u0 - q1 * d;
  if (r > q0) {
    q1--;
    r += d;
  }
  if (r >= d) {
    q1++;
    r -= d;
  }
  *rem = r;
  return q1;
}
#endif

/** 128-bit add, in two limbs. */
static inline void add128(uint64_t a1, uint64_t a0, uint64_t b1, uint64_t b0,
                          uint64_t *r1, uint64_t *r0) {
  const uint64_t s = a0 + b0;
  *r1 = a1 + b1 + (s < a0);
  *r0 = s;
}

/** 128-bit subtract, in two limbs. */
static inline void sub128(uint64_t a1, uint64_t a0, uint64_t b1, uint64_t b0,
                          uint64_t *r1, uint64_t *r0) {
  const uint64_t d = a0 - b0;
  *r1 = a1 - b1 - (a0 < b0);
  *r0 = d;
}

/** `1` when `(a1:a0) >= (b1:b0)`. */
static inline int ge128(uint64_t a1, uint64_t a0, uint64_t b1, uint64_t b0) {
  return a1 != b1 ? a1 > b1 : a0 >= b0;
}

/**
 * Möller-Granlund's reciprocal for a normalized two-limb divisor (algorithm 6).
 *
 * The top bit of `d1` must be set. Built once per division and reused for every
 * digit of the quotient.
 */
static inline uint64_t reciprocal_3by2(uint64_t d1, uint64_t d0) {
  uint64_t v = reciprocal_2by1(d1);
  uint64_t p = d1 * v + d0;
  if (p < d0) {
    v--;
    if (p >= d1) {
      v--;
      p -= d1;
    }
    p -= d1;
  }
  uint64_t t1, t0;
  mul64(v, d0, &t0, &t1);
  p += t1;
  if (p < t1) {
    v--;
    if (ge128(p, t0, d1, d0)) v--;
  }
  return v;
}

/**
 * Divides `(u2:u1:u0)` by a normalized `(d1:d0)` (Möller-Granlund algorithm 7).
 *
 * Requires `(u2:u1) < (d1:d0)`, which Knuth's normalization guarantees. Unlike a
 * 2-by-1 estimate this needs no correction loop — at most two conditional
 * adjustments — which is where the remaining gap against `ruint` on full-width
 * DIV and MULMOD was.
 */
static inline uint64_t div_3by2(uint64_t u2, uint64_t u1, uint64_t u0,
                                uint64_t d1, uint64_t d0, uint64_t v,
                                uint64_t *r1, uint64_t *r0) {
  uint64_t q1, q0;
  mul64(v, u2, &q0, &q1);
  add128(q1, q0, u2, u1, &q1, &q0);
  uint64_t new_r1 = u1 - q1 * d1;
  uint64_t t1, t0;
  mul64(d0, q1, &t0, &t1);
  uint64_t rr1, rr0;
  sub128(new_r1, u0, d1, d0, &rr1, &rr0);
  sub128(rr1, rr0, t1, t0, &rr1, &rr0);
  q1++;
  if (rr1 >= q0) {
    q1--;
    add128(rr1, rr0, d1, d0, &rr1, &rr0);
  }
  if (ge128(rr1, rr0, d1, d0)) {
    q1++;
    sub128(rr1, rr0, d1, d0, &rr1, &rr0);
  }
  *r1 = rr1;
  *r0 = rr0;
  return q1;
}

/** One 2-by-1 division step, using whichever primitive the target has. */
#ifdef OX_HAS_INT128
#define DIV2BY1(u1, u0, d, recip, rem) div_2by1((u1), (u0), (d), (recip), (rem))
#else
#define DIV2BY1(u1, u0, d, recip, rem) \
  ((void)(recip), div_2by1_portable((u1), (u0), (d), (rem)))
#endif

// Widest operand `divmod_knuth64` accepts, in 64-bit limbs. Four covers the
// EVM's own arithmetic; modexp reaches 1024-byte operands, which is 128.
#define DIV_LIMBS 128

/**
 * Knuth algorithm D over 64-bit limbs.
 *
 * An earlier version worked over 32-bit halves, which doubles both the number of
 * outer iterations and the work inside each one; that showed up as a 1.6-1.8x
 * gap against `ruint` on full-width DIV and MULMOD. Everything here is
 * 64x64->128 multiplies plus one 2-by-1 division per iteration, so no 128-bit
 * divide is needed and the same code serves wasm32.
 *
 * `num` has `n` limbs and `den` has `d`; `quot` receives `n` limbs, `rem` eight.
 */
static void divmod_knuth64(const uint64_t *num, int n, const uint64_t *den,
                           int d, uint64_t *quot, uint64_t *rem) {
  while (d > 0 && den[d - 1] == 0) d--;
  for (int i = 0; i < n; i++) quot[i] = 0;
  // The EVM's own callers read four limbs of remainder whatever `d` trims to, so
  // clear at least that many; modexp passes wider operands and a wider array.
  const int rem_len = d > 8 ? d : 8;
  for (int i = 0; i < rem_len; i++) rem[i] = 0;
  if (d == 0) return;
  // A numerator shorter than the divisor divides to zero with itself as the
  // remainder. Without this the normalization below reads past `num`.
  if (n < d) {
    for (int i = 0; i < n; i++) rem[i] = num[i];
    return;
  }

  if (d == 1) {
    // Normalize once and carry the shifted remainder through, un-shifting only
    // at the end. `r` stays below the divisor, which is what a 2-by-1 needs.
    const int s0 = __builtin_clzll(den[0]);
    const uint64_t dn = den[0] << s0;
    uint64_t recip0 = 0;
#ifdef OX_HAS_INT128
    recip0 = reciprocal_2by1(dn);
#endif
    uint64_t un1[DIV_LIMBS * 2 + 1];
    un1[n] = s0 ? num[n - 1] >> (64 - s0) : 0;
    for (int i = n - 1; i > 0; i--)
      un1[i] = (num[i] << s0) | (s0 ? num[i - 1] >> (64 - s0) : 0);
    un1[0] = num[0] << s0;
    uint64_t r = un1[n];
    for (int i = n - 1; i >= 0; i--)
      quot[i] = DIV2BY1(r, un1[i], dn, recip0, &r);
    rem[0] = r >> s0;
    return;
  }

  const int s = __builtin_clzll(den[d - 1]);
  uint64_t vn[DIV_LIMBS], un[DIV_LIMBS * 2 + 1];
  for (int i = d - 1; i > 0; i--)
    vn[i] = (den[i] << s) | (s ? den[i - 1] >> (64 - s) : 0);
  vn[0] = den[0] << s;
  un[n] = s ? num[n - 1] >> (64 - s) : 0;
  for (int i = n - 1; i > 0; i--)
    un[i] = (num[i] << s) | (s ? num[i - 1] >> (64 - s) : 0);
  un[0] = num[0] << s;

  // One reciprocal for the whole division, then a 3-by-2 estimate per digit.
  // That estimate is exact to within one, so there is no correction loop.
  const uint64_t recip = reciprocal_3by2(vn[d - 1], vn[d - 2]);
  for (int j = n - d; j >= 0; j--) {
    uint64_t qhat, rh1, rh0;
    if (ge128(un[j + d], un[j + d - 1], vn[d - 1], vn[d - 2])) {
      // The estimate saturates at b - 1. Knuth's add-back below recovers the
      // one case where that is too large.
      qhat = 0xFFFFFFFFFFFFFFFFULL;
    } else {
      qhat = div_3by2(un[j + d], un[j + d - 1], un[j + d - 2], vn[d - 1],
                      vn[d - 2], recip, &rh1, &rh0);
      (void)rh1;
      (void)rh0;
    }

    uint64_t neg;
#ifdef OX_HAS_INT128
    // Signed 128-bit intermediates let clang emit a straight `mulx`/`sbb`
    // chain; the same loop written with explicit carry flags costs a few
    // percent more.
    {
      unsigned __int128 carry = 0;
      __int128 borrow = 0;
      for (int i = 0; i < d; i++) {
        const unsigned __int128 pr = (unsigned __int128)qhat * vn[i] + carry;
        carry = pr >> 64;
        const __int128 t = (__int128)un[i + j] - (__int128)(uint64_t)pr + borrow;
        un[i + j] = (uint64_t)t;
        borrow = t >> 64; // arithmetic: 0 or -1
      }
      const __int128 t = (__int128)un[j + d] - (__int128)carry + borrow;
      un[j + d] = (uint64_t)t;
      neg = (t >> 64) != 0;
    }
#else
    {
      uint64_t carry = 0, borrow = 0;
      for (int i = 0; i < d; i++) {
        uint64_t plo, phi;
        mul64(qhat, vn[i], &plo, &phi);
        const uint64_t sum = plo + carry;
        phi += sum < plo;
        carry = phi;
        const uint64_t sub = un[i + j] - sum;
        const uint64_t b1 = un[i + j] < sum;
        const uint64_t sub2 = sub - borrow;
        borrow = b1 | (sub < borrow);
        un[i + j] = sub2;
      }
      const uint64_t top = un[j + d];
      const uint64_t t1 = top - carry;
      neg = top < carry;
      const uint64_t t2 = t1 - borrow;
      neg |= t1 < borrow;
      un[j + d] = t2;
    }
#endif
    quot[j] = qhat;
    if (neg) {
      // The estimate was one too large: give a divisor back.
      quot[j]--;
      uint64_t c = 0;
      for (int i = 0; i < d; i++) {
        const uint64_t sum = un[i + j] + vn[i];
        const uint64_t c1 = sum < un[i + j];
        const uint64_t sum2 = sum + c;
        c = c1 | (sum2 < sum);
        un[i + j] = sum2;
      }
      un[j + d] += c;
    }
  }

  for (int i = 0; i < d; i++)
    rem[i] = s ? ((un[i] >> s) | (un[i + 1] << (64 - s))) : un[i];
}


/** Number of significant 64-bit limbs, at least one. */
static inline int u256_limb_len(u256 a) {
  for (int i = 3; i >= 0; i--)
    if (a.l[i]) return i + 1;
  return 1;
}


/**
 * Divides by a divisor that fits in 32 bits.
 *
 * Real bytecode divides by small constants and powers of two far more often
 * than by full-width values, and this path avoids the halving, normalization,
 * and per-digit correction that algorithm D pays.
 *
 * The 32-bit bound is load-bearing, not incidental: the running remainder must
 * satisfy `r < 2^32` for `r << 32` below to stay inside 64 bits. A 64-bit
 * divisor would need a real 128/64 division primitive, which wasm32 lacks.
 */
static inline u256 u256_divmod_u32(u256 a, uint32_t d, uint32_t *rem) {
  u256 q = U256_ZERO;
  uint64_t r = 0;
  for (int i = 3; i >= 0; i--) {
    uint64_t hi = (r << 32) | (a.l[i] >> 32);
    uint64_t qhi = hi / d;
    r = hi % d;
    uint64_t lo = (r << 32) | (a.l[i] & 0xffffffffULL);
    uint64_t qlo = lo / d;
    r = lo % d;
    q.l[i] = (qhi << 32) | qlo;
  }
  *rem = (uint32_t)r;
  return q;
}

/** Whether `a` fits in 32 bits. */
static inline int u256_is_u32(u256 a) {
  return (a.l[1] | a.l[2] | a.l[3]) == 0 && (a.l[0] >> 32) == 0;
}

/** Whether `a` fits in 64 bits. */
static inline int u256_is_u64(u256 a) {
  return (a.l[1] | a.l[2] | a.l[3]) == 0;
}

// A 128-by-64 division is the primitive every long-division step needs. x86-64
// and aarch64 have it via `__int128`, which is what `ruint` uses.
//
// wasm32 *defines* `__SIZEOF_INT128__` but has no such instruction: LLVM lowers
// the operations to `__udivti3`/`__multi3` libcalls that do not exist in a
// freestanding build. So gate on having a real hardware divide, not on the type
// existing, and fall back to Knuth's two-digit estimate over 32-bit halves
// (Hacker's Delight `divlu`) everywhere else.
#ifdef OX_HAS_INT128
/** Divides `(hi:lo)` by `d`, requiring `hi < d`. Returns the quotient. */
static inline uint64_t udiv128by64(uint64_t hi, uint64_t lo, uint64_t d,
                                   uint64_t *rem) {
  const unsigned __int128 n = ((unsigned __int128)hi << 64) | lo;
  *rem = (uint64_t)(n % d);
  return (uint64_t)(n / d);
}
#else
static inline int clz64(uint64_t x) { return __builtin_clzll(x); }

static uint64_t udiv128by64(uint64_t hi, uint64_t lo, uint64_t d,
                            uint64_t *rem) {
  const int s = clz64(d);
  d <<= s;
  if (s) {
    hi = (hi << s) | (lo >> (64 - s));
    lo <<= s;
  }
  const uint64_t dh = d >> 32, dl = d & 0xffffffffULL;
  const uint64_t un1 = lo >> 32, un0 = lo & 0xffffffffULL;

  uint64_t q1 = hi / dh;
  uint64_t rhat = hi - q1 * dh;
  while (q1 >> 32 || q1 * dl > ((rhat << 32) | un1)) {
    q1--;
    rhat += dh;
    if (rhat >> 32) break;
  }
  const uint64_t u21 = ((hi << 32) | un1) - q1 * d;

  uint64_t q0 = u21 / dh;
  rhat = u21 - q0 * dh;
  while (q0 >> 32 || q0 * dl > ((rhat << 32) | un0)) {
    q0--;
    rhat += dh;
    if (rhat >> 32) break;
  }
  *rem = (((u21 << 32) | un0) - q0 * d) >> s;
  return (q1 << 32) | q0;
}
#endif



/**
 * Divides by a 64-bit divisor.
 *
 * Real bytecode divides by values that fit in 64 bits far more often than by
 * full-width ones — small constants, powers of two, and `1e18`-style decimal
 * scales — so this avoids algorithm D's normalization and correction entirely.
 */
static inline u256 u256_divmod_u64(u256 a, uint64_t d, uint64_t *rem) {
  u256 q = U256_ZERO;
#ifdef OX_HAS_INT128
  // One hardware divide to build the reciprocal, then four multiply-based
  // steps, rather than four hardware divides.
  const int s = __builtin_clzll(d);
  const uint64_t dn = d << s;
  const uint64_t v = reciprocal_2by1(dn);

  // Shift the numerator left by `s` to match, keeping the bits shifted out of
  // the top limb as the initial remainder.
  uint64_t n[4];
  uint64_t r;
  if (s == 0) {
    n[3] = a.l[3];
    n[2] = a.l[2];
    n[1] = a.l[1];
    n[0] = a.l[0];
    r = 0;
  } else {
    r = a.l[3] >> (64 - s);
    n[3] = (a.l[3] << s) | (a.l[2] >> (64 - s));
    n[2] = (a.l[2] << s) | (a.l[1] >> (64 - s));
    n[1] = (a.l[1] << s) | (a.l[0] >> (64 - s));
    n[0] = a.l[0] << s;
  }
  for (int i = 3; i >= 0; i--) q.l[i] = div_2by1(r, n[i], dn, v, &r);
  *rem = r >> s;
#else
  uint64_t r = 0;
  for (int i = 3; i >= 0; i--) q.l[i] = udiv128by64(r, a.l[i], d, &r);
  *rem = r;
#endif
  return q;
}

/** Reduces an 8-limb value modulo a 64-bit `m`. */
static inline uint64_t u512_mod_u64(const uint64_t *full, uint64_t m) {
#ifdef OX_HAS_INT128
  const int s = __builtin_clzll(m);
  const uint64_t mn = m << s;
  const uint64_t v = reciprocal_2by1(mn);
  // Dividing `(N << s)` by `(m << s)` leaves a remainder of `(N mod m) << s`,
  // so the numerator is fed in pre-shifted and the result shifted back.
  uint64_t r = s ? (full[7] >> (64 - s)) : 0;
  for (int i = 7; i >= 0; i--) {
    const uint64_t lo =
        s == 0 ? full[i]
               : ((full[i] << s) | (i > 0 ? full[i - 1] >> (64 - s) : 0));
    div_2by1(r, lo, mn, v, &r);
  }
  return r >> s;
#else
  uint64_t r = 0;
  for (int i = 7; i >= 0; i--) udiv128by64(r, full[i], m, &r);
  return r;
#endif
}

/** EVM DIV — division by zero yields zero. */
static inline u256 u256_div(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  if (u256_cmp(a, b) < 0) return U256_ZERO;
  if (u256_is_u64(b)) {
    uint64_t r;
    return u256_divmod_u64(a, b.l[0], &r);
  }
  // Only `quot[0..n-1]` is written, so the rest must start at zero. Trimming
  // the numerator drops whole outer iterations of algorithm D.
  uint64_t q[4] = {0}, r[8];
  divmod_knuth64(a.l, u256_limb_len(a), b.l, 4, q, r);
  return (u256){{q[0], q[1], q[2], q[3]}};
}

/** EVM MOD — modulus by zero yields zero. */
static inline u256 u256_mod(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  if (u256_cmp(a, b) < 0) return a;
  if (u256_is_u64(b)) {
    uint64_t r;
    u256_divmod_u64(a, b.l[0], &r);
    return u256_from_u64(r);
  }
  uint64_t q[4], r[8];
  divmod_knuth64(a.l, u256_limb_len(a), b.l, 4, q, r);
  return (u256){{r[0], r[1], r[2], r[3]}};
}

/** EVM SDIV — two's-complement division, truncating toward zero. */
static inline u256 u256_sdiv(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  int na = u256_sign(a), nb = u256_sign(b);
  u256 ua = na ? u256_neg(a) : a;
  u256 ub = nb ? u256_neg(b) : b;
  u256 q = u256_div(ua, ub);
  return (na ^ nb) ? u256_neg(q) : q;
}

/** EVM SMOD — remainder takes the sign of the dividend. */
static inline u256 u256_smod(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  int na = u256_sign(a);
  u256 ua = na ? u256_neg(a) : a;
  u256 ub = u256_sign(b) ? u256_neg(b) : b;
  u256 r = u256_mod(ua, ub);
  return na ? u256_neg(r) : r;
}

/** EVM ADDMOD — the sum is computed at 257 bits before reduction. */
static inline u256 u256_addmod(u256 a, u256 b, u256 m) {
  if (u256_is_zero(m)) return U256_ZERO;
  u256 s = u256_add(a, b);
  // Recover the carry bit lost by the wrapping add.
  int carry = u256_cmp(s, a) < 0;
  if (u256_is_u64(m)) {
    const uint64_t wide[8] = {s.l[0],           s.l[1], s.l[2], s.l[3],
                              (uint64_t)carry, 0,      0,      0};
    return u256_from_u64(u512_mod_u64(wide, m.l[0]));
  }
  const uint64_t n[5] = {s.l[0], s.l[1], s.l[2], s.l[3], (uint64_t)carry};
  uint64_t q[5], r[8];
  divmod_knuth64(n, 5, m.l, 4, q, r);
  return (u256){{r[0], r[1], r[2], r[3]}};
}

/** EVM MULMOD — the product is computed at 512 bits before reduction. */
static inline u256 u256_mulmod(u256 a, u256 b, u256 m) {
  if (u256_is_zero(m)) return U256_ZERO;
  uint64_t full[8];
  u256_mul_full(a, b, full);
  if (u256_is_u64(m)) return u256_from_u64(u512_mod_u64(full, m.l[0]));
  int len = 8;
  while (len > 1 && full[len - 1] == 0) len--;
  uint64_t q[8], r[8];
  divmod_knuth64(full, len, m.l, 4, q, r);
  return (u256){{r[0], r[1], r[2], r[3]}};
}

/** EVM EXP — square-and-multiply, wrapping at 256 bits. */
static inline u256 u256_exp(u256 base, u256 e) {
  u256 result = U256_ONE;
  u256 b = base;
  for (int i = 0; i < 256; i++) {
    if ((e.l[i / 64] >> (i % 64)) & 1) result = u256_mul(result, b);
    // Skip the final squaring once no set bits remain.
    u256 rest = u256_shr(e, (uint32_t)i + 1);
    if (u256_is_zero(rest)) break;
    b = u256_mul(b, b);
  }
  return result;
}

/** EVM SIGNEXTEND — extends the sign of the `(k+1)`-byte value in `v`. */
static inline u256 u256_signextend(u256 k, u256 v) {
  uint64_t kb = u256_to_u64_sat(k);
  if (kb >= 31) return v;
  uint32_t bit = (uint32_t)(kb * 8 + 7);
  u256 mask = u256_sub(u256_shl(U256_ONE, bit), U256_ONE);
  int negative = (v.l[bit / 64] >> (bit % 64)) & 1;
  if (negative) return u256_or(v, u256_not(mask));
  return u256_and(v, mask);
}

/** EVM BYTE — big-endian byte `i` of `v`, zero when out of range. */
static inline u256 u256_byte(u256 i, u256 v) {
  uint64_t idx = u256_to_u64_sat(i);
  if (idx >= 32) return U256_ZERO;
  uint32_t shift = (uint32_t)((31 - idx) * 8);
  return u256_from_u64((v.l[shift / 64] >> (shift % 64)) & 0xff);
}

// ---------------------------------------------------------------------------
// Big-endian conversion — the EVM's external byte order.
// ---------------------------------------------------------------------------

// A byte-reversed 64-bit load beats the byte-at-a-time shift-or loops these
// replaced: `PUSH32`, `MLOAD`, and `MSTORE` are among the most frequent
// instructions in real bytecode and each was paying 32 variable shifts.
static inline uint64_t load64(const uint8_t *p) {
  uint64_t v;
  __builtin_memcpy(&v, p, 8);
  return v;
}

static inline void store64(uint8_t *p, uint64_t v) {
  __builtin_memcpy(p, &v, 8);
}

static inline u256 u256_from_be(const uint8_t *p) {
  u256 r;
  r.l[3] = __builtin_bswap64(load64(p));
  r.l[2] = __builtin_bswap64(load64(p + 8));
  r.l[1] = __builtin_bswap64(load64(p + 16));
  r.l[0] = __builtin_bswap64(load64(p + 24));
  return r;
}

/** Reads `n` (<= 32) big-endian bytes as a right-aligned word. */
static inline u256 u256_from_be_n(const uint8_t *p, int n) {
  if (n == 32) return u256_from_be(p);
  u256 r = U256_ZERO;
  // Whole limbs first, from the least-significant end of the value.
  int i = n;
  int limb = 0;
  while (i >= 8) {
    r.l[limb++] = __builtin_bswap64(load64(p + i - 8));
    i -= 8;
  }
  uint64_t tail = 0;
  for (int k = 0; k < i; k++) tail = (tail << 8) | p[k];
  if (limb < 4) r.l[limb] = tail;
  return r;
}

static inline void u256_to_be(u256 a, uint8_t *p) {
  store64(p, __builtin_bswap64(a.l[3]));
  store64(p + 8, __builtin_bswap64(a.l[2]));
  store64(p + 16, __builtin_bswap64(a.l[1]));
  store64(p + 24, __builtin_bswap64(a.l[0]));
}

#endif  // OX_EVM_U256_H
