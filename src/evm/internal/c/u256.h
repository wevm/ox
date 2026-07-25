// 256-bit word arithmetic for the Ox EVM.
//
// Words are four 64-bit limbs, least-significant first. This layout maps
// directly onto wasm i64 locals and onto x86-64/aarch64 registers, and lets
// the byte-order conversions at the ABI boundary be plain 64-bit swaps.
//
// Division and the 512-bit intermediates required by MULMOD share one Knuth
// algorithm-D implementation over 32-bit halves (`divmod_knuth`), so there is
// a single code path to get right.

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

// 64x64 -> 128 without relying on __int128, which wasm32 does not have.
static inline void mul64(uint64_t a, uint64_t b, uint64_t *lo, uint64_t *hi) {
  uint64_t a0 = a & 0xffffffffULL, a1 = a >> 32;
  uint64_t b0 = b & 0xffffffffULL, b1 = b >> 32;
  uint64_t p00 = a0 * b0;
  uint64_t p01 = a0 * b1;
  uint64_t p10 = a1 * b0;
  uint64_t p11 = a1 * b1;
  uint64_t mid = (p00 >> 32) + (p01 & 0xffffffffULL) + (p10 & 0xffffffffULL);
  *lo = (mid << 32) | (p00 & 0xffffffffULL);
  *hi = p11 + (p01 >> 32) + (p10 >> 32) + (mid >> 32);
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

/** Wrapping 256-bit product (the MUL opcode). */
static inline u256 u256_mul(u256 a, u256 b) {
  uint64_t full[8];
  u256_mul_full(a, b, full);
  return (u256){{full[0], full[1], full[2], full[3]}};
}

static inline u256 u256_shl(u256 a, uint32_t n) {
  if (n >= 256) return U256_ZERO;
  u256 r = U256_ZERO;
  uint32_t limbs = n / 64, bits = n % 64;
  for (int i = 3; i >= (int)limbs; i--) {
    uint64_t v = a.l[i - limbs] << bits;
    if (bits && i - (int)limbs - 1 >= 0) v |= a.l[i - limbs - 1] >> (64 - bits);
    r.l[i] = v;
  }
  return r;
}

static inline u256 u256_shr(u256 a, uint32_t n) {
  if (n >= 256) return U256_ZERO;
  u256 r = U256_ZERO;
  uint32_t limbs = n / 64, bits = n % 64;
  for (int i = 0; i + (int)limbs < 4; i++) {
    uint64_t v = a.l[i + limbs] >> bits;
    if (bits && i + (int)limbs + 1 < 4) v |= a.l[i + limbs + 1] << (64 - bits);
    r.l[i] = v;
  }
  return r;
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
 * Divides `num` (n32 halves) by `den` (d32 halves), writing the quotient to
 * `quot` (n32 halves) and the remainder to `rem` (d32 halves). Caller
 * guarantees the divisor is non-zero.
 */
static void divmod_knuth(const uint32_t *num, int n32, const uint32_t *den,
                         int d32, uint32_t *quot, uint32_t *rem) {
  while (d32 > 0 && den[d32 - 1] == 0) d32--;
  for (int i = 0; i < n32; i++) quot[i] = 0;

  if (d32 == 1) {
    uint64_t r = 0;
    for (int i = n32 - 1; i >= 0; i--) {
      uint64_t cur = (r << 32) | num[i];
      quot[i] = (uint32_t)(cur / den[0]);
      r = cur % den[0];
    }
    rem[0] = (uint32_t)r;
    for (int i = 1; i < d32; i++) rem[i] = 0;
    return;
  }

  // Normalize so the divisor's top half has its high bit set.
  int shift = 0;
  uint32_t top = den[d32 - 1];
  while (!(top & 0x80000000u)) {
    top <<= 1;
    shift++;
  }

  uint32_t un[18], vn[10];  // n32 <= 16, d32 <= 8, plus one overflow half
  for (int i = d32 - 1; i > 0; i--)
    vn[i] = (den[i] << shift) | (shift ? den[i - 1] >> (32 - shift) : 0);
  vn[0] = den[0] << shift;

  un[n32] = shift ? num[n32 - 1] >> (32 - shift) : 0;
  for (int i = n32 - 1; i > 0; i--)
    un[i] = (num[i] << shift) | (shift ? num[i - 1] >> (32 - shift) : 0);
  un[0] = num[0] << shift;

  for (int j = n32 - d32; j >= 0; j--) {
    uint64_t head = ((uint64_t)un[j + d32] << 32) | un[j + d32 - 1];
    uint64_t qhat = head / vn[d32 - 1];
    uint64_t rhat = head % vn[d32 - 1];
    while (qhat > 0xffffffffULL ||
           qhat * vn[d32 - 2] > ((rhat << 32) | un[j + d32 - 2])) {
      qhat--;
      rhat += vn[d32 - 1];
      if (rhat > 0xffffffffULL) break;
    }

    int64_t borrow = 0;
    uint64_t carry = 0;
    for (int i = 0; i < d32; i++) {
      uint64_t p = qhat * vn[i] + carry;
      carry = p >> 32;
      int64_t t = (int64_t)un[i + j] - (int64_t)(p & 0xffffffffULL) - borrow;
      un[i + j] = (uint32_t)t;
      borrow = t < 0 ? 1 : 0;
    }
    int64_t t = (int64_t)un[j + d32] - (int64_t)carry - borrow;
    un[j + d32] = (uint32_t)t;

    if (t < 0) {
      // qhat was one too large: add the divisor back.
      qhat--;
      carry = 0;
      for (int i = 0; i < d32; i++) {
        uint64_t s = (uint64_t)un[i + j] + vn[i] + carry;
        un[i + j] = (uint32_t)s;
        carry = s >> 32;
      }
      un[j + d32] += (uint32_t)carry;
    }
    quot[j] = (uint32_t)qhat;
  }

  for (int i = 0; i < d32; i++)
    rem[i] = (un[i] >> shift) | (shift ? un[i + 1] << (32 - shift) : 0);
}

/** Number of significant 32-bit halves, minimum 1. */
static inline int u256_h32_len(u256 a) {
  for (int i = 3; i >= 0; i--) {
    if (a.l[i] == 0) continue;
    return (a.l[i] >> 32) ? i * 2 + 2 : i * 2 + 1;
  }
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

static inline void u256_to_h32(u256 a, uint32_t *out) {
  for (int i = 0; i < 4; i++) {
    out[i * 2] = (uint32_t)a.l[i];
    out[i * 2 + 1] = (uint32_t)(a.l[i] >> 32);
  }
}

static inline u256 u256_from_h32(const uint32_t *in) {
  u256 r;
  for (int i = 0; i < 4; i++)
    r.l[i] = (uint64_t)in[i * 2] | ((uint64_t)in[i * 2 + 1] << 32);
  return r;
}

/** EVM DIV — division by zero yields zero. */
static inline u256 u256_div(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  if (u256_cmp(a, b) < 0) return U256_ZERO;
  if (u256_is_u32(b)) {
    uint32_t r;
    return u256_divmod_u32(a, (uint32_t)b.l[0], &r);
  }
  // `divmod_knuth` only writes `quot[0..n32-1]`, so a trimmed numerator leaves
  // the upper halves untouched — they must start at zero.
  uint32_t n[8], d[8], q[8] = {0}, r[8];
  u256_to_h32(a, n);
  u256_to_h32(b, d);
  // Trimming the numerator drops whole outer iterations of algorithm D.
  divmod_knuth(n, u256_h32_len(a), d, 8, q, r);
  return u256_from_h32(q);
}

/** EVM MOD — modulus by zero yields zero. */
static inline u256 u256_mod(u256 a, u256 b) {
  if (u256_is_zero(b)) return U256_ZERO;
  if (u256_cmp(a, b) < 0) return a;
  if (u256_is_u32(b)) {
    uint32_t r;
    u256_divmod_u32(a, (uint32_t)b.l[0], &r);
    return u256_from_u64(r);
  }
  uint32_t n[8], d[8], q[8], r[8] = {0};
  u256_to_h32(a, n);
  u256_to_h32(b, d);
  divmod_knuth(n, u256_h32_len(a), d, 8, q, r);
  return u256_from_h32(r);
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
  uint32_t n[10] = {0}, d[8], q[10], r[8] = {0};
  u256 s = u256_add(a, b);
  // Recover the carry bit lost by the wrapping add.
  int carry = u256_cmp(s, a) < 0;
  u256_to_h32(s, n);
  n[8] = carry;
  u256_to_h32(m, d);
  divmod_knuth(n, 10, d, 8, q, r);
  return u256_from_h32(r);
}

/** EVM MULMOD — the product is computed at 512 bits before reduction. */
static inline u256 u256_mulmod(u256 a, u256 b, u256 m) {
  if (u256_is_zero(m)) return U256_ZERO;
  uint64_t full[8];
  u256_mul_full(a, b, full);
  uint32_t n[16], d[8], q[16], r[8] = {0};
  for (int i = 0; i < 8; i++) {
    n[i * 2] = (uint32_t)full[i];
    n[i * 2 + 1] = (uint32_t)(full[i] >> 32);
  }
  u256_to_h32(m, d);
  divmod_knuth(n, 16, d, 8, q, r);
  return u256_from_h32(r);
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
