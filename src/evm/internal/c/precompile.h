// Precompiled contracts implementable without elliptic-curve arithmetic.
//
// The bn254 pair (0x06-0x08), KZG (0x0a), and the BLS12-381 set (0x0b-0x11)
// still need their own curve arithmetic; they are reported as unsupported so the
// caller can tell "wrong answer" apart from "not implemented". ecrecover lives
// in `secp256k1.h`.

#ifndef OX_EVM_PRECOMPILE_H
#define OX_EVM_PRECOMPILE_H

#include "keccak.h"
#include "secp256k1.h"
#include "u256.h"

#define PRE_OK 0
#define PRE_FAIL 1        // precompile ran and rejected its input
#define PRE_UNSUPPORTED 2 // not implemented here

// ---------------------------------------------------------------------------
// SHA-256 (0x02)
// ---------------------------------------------------------------------------

static const uint32_t SHA256_K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};

#define ROTR32(x, n) (((x) >> (n)) | ((x) << (32 - (n))))

/** One compression round over a 64-byte block. */
static void sha256_block(uint32_t h[8], const uint8_t *block) {
  uint32_t w[64];
  for (int i = 0; i < 16; i++)
    w[i] = ((uint32_t)block[i * 4] << 24) | ((uint32_t)block[i * 4 + 1] << 16) |
           ((uint32_t)block[i * 4 + 2] << 8) | (uint32_t)block[i * 4 + 3];
  for (int i = 16; i < 64; i++) {
    const uint32_t s0 =
        ROTR32(w[i - 15], 7) ^ ROTR32(w[i - 15], 18) ^ (w[i - 15] >> 3);
    const uint32_t s1 =
        ROTR32(w[i - 2], 17) ^ ROTR32(w[i - 2], 19) ^ (w[i - 2] >> 10);
    w[i] = w[i - 16] + s0 + w[i - 7] + s1;
  }
  uint32_t a = h[0], b = h[1], c = h[2], d = h[3];
  uint32_t e = h[4], f = h[5], g = h[6], hh = h[7];
  for (int i = 0; i < 64; i++) {
    const uint32_t S1 = ROTR32(e, 6) ^ ROTR32(e, 11) ^ ROTR32(e, 25);
    const uint32_t ch = (e & f) ^ (~e & g);
    const uint32_t t1 = hh + S1 + ch + SHA256_K[i] + w[i];
    const uint32_t S0 = ROTR32(a, 2) ^ ROTR32(a, 13) ^ ROTR32(a, 22);
    const uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
    const uint32_t t2 = S0 + maj;
    hh = g; g = f; f = e; e = d + t1;
    d = c; c = b; b = a; a = t1 + t2;
  }
  h[0] += a; h[1] += b; h[2] += c; h[3] += d;
  h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
}

/**
 * Whole blocks are compressed straight out of the caller's buffer; only the
 * final one or two are assembled.
 *
 * The version this replaces built every block a byte at a time through four
 * branches deciding message, padding, or length — for interior blocks, where
 * the answer is always "message". That was most of the cost on inputs of any
 * size.
 */
static void sha256(const uint8_t *in, uint64_t len, uint8_t *out) {
  uint32_t h[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                   0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
  uint64_t off = 0;
  for (; off + 64 <= len; off += 64) sha256_block(h, in + off);

  // The tail: what is left, a 0x80 byte, zeroes, and the bit count. That fits
  // in one block unless the remainder reaches 56.
  uint8_t tail[128];
  const uint64_t rem = len - off;
  const uint64_t tail_len = rem < 56 ? 64 : 128;
  for (uint64_t i = 0; i < rem; i++) tail[i] = in[off + i];
  tail[rem] = 0x80;
  for (uint64_t i = rem + 1; i < tail_len; i++) tail[i] = 0;
  const uint64_t bits = len * 8;
  for (int i = 0; i < 8; i++)
    tail[tail_len - 1 - i] = (uint8_t)(bits >> (i * 8));
  sha256_block(h, tail);
  if (tail_len == 128) sha256_block(h, tail + 64);

  for (int i = 0; i < 8; i++) {
    out[i * 4] = (uint8_t)(h[i] >> 24);
    out[i * 4 + 1] = (uint8_t)(h[i] >> 16);
    out[i * 4 + 2] = (uint8_t)(h[i] >> 8);
    out[i * 4 + 3] = (uint8_t)h[i];
  }
}

// ---------------------------------------------------------------------------
// RIPEMD-160 (0x03)
// ---------------------------------------------------------------------------

#define ROTL32(x, n) (((x) << (n)) | ((x) >> (32 - (n))))

static const uint8_t rl[80] = {
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13};
static const uint8_t rr[80] = {
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11};
static const uint8_t sl[80] = {
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6};
static const uint8_t sr[80] = {
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11};
static const uint32_t kl[5] = {0, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc,
                               0xa953fd4e};
static const uint32_t kr[5] = {0x50a28be6, 0x5c4dd124, 0x6d703ef3,
                               0x7a6d76e9, 0};


/** One compression round over a 64-byte block, whose words are little-endian. */
static void ripemd160_block(uint32_t h[5], const uint8_t *block) {
  uint32_t x[16];
  for (int i = 0; i < 16; i++)
    x[i] = (uint32_t)block[i * 4] | ((uint32_t)block[i * 4 + 1] << 8) |
           ((uint32_t)block[i * 4 + 2] << 16) |
           ((uint32_t)block[i * 4 + 3] << 24);
  uint32_t al = h[0], bl = h[1], cl = h[2], dl = h[3], el = h[4];
  uint32_t ar = h[0], br = h[1], cr = h[2], dr = h[3], er = h[4];
  // Five passes of sixteen rather than eighty with a switch inside. The round
  // function is constant within a pass, so this turns two unpredictable
  // branches per round into none, and lets the constants fold.
#define RMD_PASS(r, FL, FR)                                       \
  for (int i = (r) * 16; i < (r) * 16 + 16; i++) {                \
    uint32_t t = ROTL32(al + (FL) + x[rl[i]] + kl[r], sl[i]) + el; \
    al = el; el = dl; dl = ROTL32(cl, 10); cl = bl; bl = t;       \
    t = ROTL32(ar + (FR) + x[rr[i]] + kr[r], sr[i]) + er;         \
    ar = er; er = dr; dr = ROTL32(cr, 10); cr = br; br = t;       \
  }
  RMD_PASS(0, bl ^ cl ^ dl, br ^ (cr | ~dr))
  RMD_PASS(1, (bl & cl) | (~bl & dl), (br & dr) | (cr & ~dr))
  RMD_PASS(2, (bl | ~cl) ^ dl, (br | ~cr) ^ dr)
  RMD_PASS(3, (bl & dl) | (cl & ~dl), (br & cr) | (~br & dr))
  RMD_PASS(4, bl ^ (cl | ~dl), br ^ cr ^ dr)
#undef RMD_PASS
  const uint32_t t = h[1] + cl + dr;
  h[1] = h[2] + dl + er;
  h[2] = h[3] + el + ar;
  h[3] = h[4] + al + br;
  h[4] = h[0] + bl + cr;
  h[0] = t;
}

/** As with sha256, whole blocks are compressed in place; only the tail is built. */
static void ripemd160(const uint8_t *in, uint64_t len, uint8_t *out) {
  uint32_t h[5] = {0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0};
  uint64_t off = 0;
  for (; off + 64 <= len; off += 64) ripemd160_block(h, in + off);

  uint8_t tail[128];
  const uint64_t rem = len - off;
  const uint64_t tail_len = rem < 56 ? 64 : 128;
  for (uint64_t i = 0; i < rem; i++) tail[i] = in[off + i];
  tail[rem] = 0x80;
  for (uint64_t i = rem + 1; i < tail_len; i++) tail[i] = 0;
  const uint64_t bits = len * 8;
  // The length is little-endian here, unlike sha256.
  for (int i = 0; i < 8; i++)
    tail[tail_len - 8 + i] = (uint8_t)(bits >> (i * 8));
  ripemd160_block(h, tail);
  if (tail_len == 128) ripemd160_block(h, tail + 64);

  // The digest is 20 bytes, left-padded to 32 as the precompile requires.
  for (int i = 0; i < 12; i++) out[i] = 0;
  for (int i = 0; i < 5; i++) {
    out[12 + i * 4] = (uint8_t)h[i];
    out[12 + i * 4 + 1] = (uint8_t)(h[i] >> 8);
    out[12 + i * 4 + 2] = (uint8_t)(h[i] >> 16);
    out[12 + i * 4 + 3] = (uint8_t)(h[i] >> 24);
  }
}

// ---------------------------------------------------------------------------
// MODEXP (0x05)
// ---------------------------------------------------------------------------

// The precompile accepts operands up to 1024 bytes, which is 128 64-bit limbs.
// An earlier version used 32-bit limbs and only 128 of them — half the width the
// precompile allows — so a modulus past 512 bytes was silently truncated and the
// result was wrong rather than merely slow.
#define MODEXP_LIMBS 128
/** The widest operand the fixed-size limb buffers above can hold. */
#define MODEXP_MAX_BYTES (MODEXP_LIMBS * 8)

typedef struct {
  uint64_t d[MODEXP_LIMBS];
  int n; // significant limbs, zero for the value zero
} bignum;

static void bn_trim(bignum *a) {
  a->n = 0;
  for (int i = MODEXP_LIMBS - 1; i >= 0; i--)
    if (a->d[i]) {
      a->n = i + 1;
      break;
    }
}

/**
 * Sets `n` by scanning down from `upto`, leaving anything above it alone.
 *
 * A reduction's result is below the modulus, so only that many limbs can be
 * set and only that many are worth writing or scanning. Doing both over the
 * full 128-limb buffer cost about 110 ns on every multiplication whatever the
 * operands' size — which for a small modulus was the entire operation, and is
 * why a 64-bit modexp was running at 126 ns per step instead of fifteen.
 *
 * Limbs above `n` are left stale, so every reader must respect `n`.
 */
static void bn_trim_to(bignum *a, int upto) {
  a->n = 0;
  for (int i = upto - 1; i >= 0; i--)
    if (a->d[i]) {
      a->n = i + 1;
      break;
    }
}

static void bn_from_be(bignum *r, const uint8_t *p, uint64_t len) {
  for (int i = 0; i < MODEXP_LIMBS; i++) r->d[i] = 0;
  if (len > (uint64_t)MODEXP_LIMBS * 8) len = (uint64_t)MODEXP_LIMBS * 8;
  for (uint64_t i = 0; i < len; i++) {
    const uint64_t shift = (len - 1 - i) * 8;
    r->d[shift / 64] |= (uint64_t)p[i] << (shift % 64);
  }
  bn_trim(r);
}

static int bn_is_zero(const bignum *a) { return a->n == 0; }

/**
 * `r = a * b mod m`.
 *
 * Schoolbook multiply into a double-width buffer, then one Knuth division to
 * reduce. The reduction used to be a bit-at-a-time long division, which costs a
 * factor of 64 more and put a 1024-byte modular exponentiation into minutes.
 */
static void bn_mulmod(bignum *r, const bignum *a, const bignum *b,
                      const bignum *m) {
  uint64_t t[MODEXP_LIMBS * 2 + 1];
  const int tn = a->n + b->n;
  for (int i = 0; i <= tn; i++) t[i] = 0;
  for (int i = 0; i < a->n; i++) {
    uint64_t carry = 0;
    for (int j = 0; j < b->n; j++) {
      uint64_t lo, hi;
      mul64(a->d[i], b->d[j], &lo, &hi);
      uint64_t sum = t[i + j] + lo;
      hi += sum < lo;
      sum += carry;
      hi += sum < carry;
      t[i + j] = sum;
      carry = hi;
    }
    t[i + b->n] += carry;
  }
  int len = tn;
  while (len > 1 && t[len - 1] == 0) len--;

  uint64_t quot[MODEXP_LIMBS * 2 + 1], rem[MODEXP_LIMBS * 2 + 1];
  divmod_knuth64(t, len, m->d, m->n, quot, rem);
  for (int i = 0; i < m->n; i++) r->d[i] = rem[i];
  bn_trim_to(r, m->n);
}

/**
 * `r = a * a mod m`.
 *
 * The cross terms of a square appear twice, so the upper triangle is summed
 * once, doubled, and the diagonal added: about half the limb products of the
 * general multiplication. Squarings are most of an exponentiation — a 1024-bit
 * exponent is a thousand of them against a few hundred multiplications.
 */
static void bn_sqrmod(bignum *r, const bignum *a, const bignum *m) {
  const int n = a->n;
  if (n == 0) {
    for (int i = 0; i < MODEXP_LIMBS; i++) r->d[i] = 0;
    r->n = 0;
    return;
  }
  uint64_t t[MODEXP_LIMBS * 2 + 1];
  for (int i = 0; i <= 2 * n; i++) t[i] = 0;
  // Upper triangle: every product with i < j, each counted once.
  for (int i = 0; i < n; i++) {
    uint64_t carry = 0;
    for (int j = i + 1; j < n; j++) {
      uint64_t lo, hi;
      mul64(a->d[i], a->d[j], &lo, &hi);
      uint64_t sum = t[i + j] + lo;
      hi += sum < lo;
      sum += carry;
      hi += sum < carry;
      t[i + j] = sum;
      carry = hi;
    }
    t[i + n] = carry;
  }
  // Double it, then add the diagonal squares.
  uint64_t carry = 0;
  for (int i = 0; i <= 2 * n - 1; i++) {
    const uint64_t next = t[i] >> 63;
    t[i] = (t[i] << 1) | carry;
    carry = next;
  }
  t[2 * n] = carry;
  carry = 0;
  for (int i = 0; i < n; i++) {
    uint64_t lo, hi;
    mul64(a->d[i], a->d[i], &lo, &hi);
    uint64_t sum = t[2 * i] + lo;
    uint64_t c1 = sum < lo;
    sum += carry;
    c1 += sum < carry;
    t[2 * i] = sum;
    sum = t[2 * i + 1] + hi;
    uint64_t c2 = sum < hi;
    sum += c1;
    c2 += sum < c1;
    t[2 * i + 1] = sum;
    carry = c2;
  }
  if (carry) t[2 * n] += carry;

  int len = 2 * n + 1;
  while (len > 1 && t[len - 1] == 0) len--;
  uint64_t quot[MODEXP_LIMBS * 2 + 1], rem[MODEXP_LIMBS * 2 + 1];
  divmod_knuth64(t, len, m->d, m->n, quot, rem);
  for (int i = 0; i < m->n; i++) r->d[i] = rem[i];
  bn_trim_to(r, m->n);
}

/** `base^exp mod m`, big-endian in and out. Writes `ml` bytes. */
static void modexp(const uint8_t *base, uint64_t bl, const uint8_t *exp,
                   uint64_t el, const uint8_t *mod, uint64_t ml,
                   uint8_t *out) {
  for (uint64_t i = 0; i < ml; i++) out[i] = 0;
  bignum b, m, acc;
  bn_from_be(&b, base, bl);
  bn_from_be(&m, mod, ml);
  if (bn_is_zero(&m)) return;
  // Everything is zero mod one.
  if (m.n == 1 && m.d[0] == 1) return;

  // A single-limb modulus is worth its own loop. Every `bn_mulmod` reduction
  // renormalises the divisor and rebuilds its reciprocal, which for a 64-bit
  // modulus is the entire cost — and the corpus leans on that case, with an
  // 8-byte modulus against a 896-byte exponent field. Hoisting the reciprocal
  // out leaves one 128-by-64 division per multiplication.
  if (m.n == 1) {
    const uint64_t d = m.d[0];
    const int sh = __builtin_clzll(d);
    const uint64_t dn = d << sh;
    const uint64_t recip = reciprocal_2by1(dn);
    // `(hi:lo) mod d`, numerator fed in pre-shifted so the divisor is
    // normalised. `hi < d` holds because both factors are already reduced.
#define MODEXP_RED(hi, lo, out)                                        \
  do {                                                                 \
    const uint64_t n2 = sh ? ((hi) >> (64 - sh)) : 0;                  \
    const uint64_t n1 = ((hi) << sh) | (sh ? ((lo) >> (64 - sh)) : 0); \
    const uint64_t n0 = (lo) << sh;                                    \
    uint64_t rr_ = n2;                                                 \
    (void)DIV2BY1(rr_, n1, dn, recip, &rr_);                           \
    (void)DIV2BY1(rr_, n0, dn, recip, &rr_);                           \
    (out) = rr_ >> sh;                                                 \
  } while (0)

    uint64_t hi, lo, base;
    {
      bignum one1, red;
      for (int i = 0; i < MODEXP_LIMBS; i++) one1.d[i] = 0;
      one1.d[0] = 1;
      one1.n = 1;
      bn_mulmod(&red, &b, &one1, &m);
      base = red.n ? red.d[0] : 0;
    }
    uint64_t tab[16];
    tab[1] = base;
    for (int i = 2; i < 16; i++) {
      mul64(tab[i - 1], base, &lo, &hi);
      MODEXP_RED(hi, lo, tab[i]);
    }
    uint64_t acc1 = 1 % d;
    int begun = 0;
    for (uint64_t byte = 0; byte < el; byte++)
      for (int half = 0; half < 2; half++) {
        const int w = (exp[byte] >> (half ? 0 : 4)) & 0xf;
        if (begun)
          for (int k = 0; k < 4; k++) {
            mul64(acc1, acc1, &lo, &hi);
            MODEXP_RED(hi, lo, acc1);
          }
        if (w) {
          if (begun) {
            mul64(acc1, tab[w], &lo, &hi);
            MODEXP_RED(hi, lo, acc1);
          } else {
            acc1 = tab[w];
            begun = 1;
          }
        }
      }
#undef MODEXP_RED
    for (uint64_t i = 0; i < ml; i++) {
      const uint64_t shift = (ml - 1 - i) * 8;
      out[i] = shift < 64 ? (uint8_t)(acc1 >> shift) : 0;
    }
    return;
  }

  for (int i = 0; i < MODEXP_LIMBS; i++) acc.d[i] = 0;
  acc.d[0] = 1;
  acc.n = 1;
  bignum base_red;
  {
    // Reduce the base first so the squaring chain stays bounded.
    bignum one;
    for (int i = 0; i < MODEXP_LIMBS; i++) one.d[i] = 0;
    one.d[0] = 1;
    one.n = 1;
    bn_mulmod(&base_red, &b, &one, &m);
  }
  // Left to right, so leading zero bits cost nothing. The right-to-left form
  // this replaces squared once per bit of the *encoded* exponent, and EIP-198
  // lets that be much wider than the value in it: the ethpandaops corpus has an
  // 896-byte exponent field, which was thousands of squarings of a value that
  // had not started yet.
  //
  // Four bits at a time as well: the fifteen-entry table costs fourteen
  // multiplications and removes about a quarter of the rest. Montgomery form
  // was tried here and is not worth it — at these widths its second schoolbook
  // product costs about what the Knuth division it replaces did, and it
  // measured 4.56 ms against 3.94 for a hundred and twenty lines of carry
  // propagation.
  // The window only pays for itself once the exponent is long enough. Its
  // table costs fourteen multiplications and saves about 0.27 per exponent
  // bit, so the crossover is near fifty bits — and EIP-198 exponents are
  // routinely far shorter than the field holding them. `mod_1024_exp_2` in the
  // corpus is a two-bit exponent against a 1024-byte modulus, where the table
  // was fourteen full-width multiplications to replace one.
  uint64_t ebits = 0;
  for (uint64_t byte = 0; byte < el; byte++)
    if (exp[byte]) {
      ebits = (el - byte) * 8;
      uint8_t v = exp[byte];
      while (!(v & 0x80)) {
        ebits--;
        v = (uint8_t)(v << 1);
      }
      break;
    }
  const int win = ebits > 50 ? 4 : 1;

  bignum tab[16];
  tab[1] = base_red;
  if (win == 4)
    for (int i = 2; i < 16; i++) bn_mulmod(&tab[i], &tab[i - 1], &base_red, &m);

  int started = 0;
  for (uint64_t byte = 0; byte < el; byte++) {
    for (int step = 0; step < 8 / win; step++) {
      const int shift = 8 - win * (step + 1);
      const int w = (exp[byte] >> shift) & ((1 << win) - 1);
      if (started)
        for (int k = 0; k < win; k++) bn_sqrmod(&acc, &acc, &m);
      if (w) {
        if (started) {
          bn_mulmod(&acc, &acc, &tab[w], &m);
        } else {
          acc = tab[w];
          started = 1;
        }
      }
    }
  }
  for (uint64_t i = 0; i < ml; i++) {
    const uint64_t shift = (ml - 1 - i) * 8;
    const uint64_t limb = shift / 64;
    // Bounded by `n`, not by the buffer: limbs above it are stale now.
    out[i] = limb < (uint64_t)acc.n ? (uint8_t)(acc.d[limb] >> (shift % 64)) : 0;
  }
}

// ---------------------------------------------------------------------------
// BLAKE2b compression (EIP-152, precompile 0x09)
// ---------------------------------------------------------------------------

// The precompile exposes the raw compression function `F`, not a hash: the
// caller supplies the round count, the state, the message block, the offset
// counters, and the final-block flag.

static const uint8_t blake2b_sigma[10][16] = {
    {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15},
    {14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3},
    {11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4},
    {7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8},
    {9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13},
    {2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9},
    {12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11},
    {13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10},
    {6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5},
    {10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0},
};

static const uint64_t blake2b_iv[8] = {
    0x6A09E667F3BCC908ULL, 0xBB67AE8584CAA73BULL, 0x3C6EF372FE94F82BULL,
    0xA54FF53A5F1D36F1ULL, 0x510E527FADE682D1ULL, 0x9B05688C2B3E6C1FULL,
    0x1F83D9ABFB41BD6BULL, 0x5BE0CD19137E2179ULL};

#define ROTR64(x, n) (((x) >> (n)) | ((x) << (64 - (n))))

/** BLAKE2b words are little-endian, unlike the rest of the EVM's encodings. */
static inline uint64_t load64_le(const uint8_t *p) {
  uint64_t v = 0;
  for (int i = 0; i < 8; i++) v |= (uint64_t)p[i] << (i * 8);
  return v;
}
static inline void store64_le(uint8_t *p, uint64_t v) {
  for (int i = 0; i < 8; i++) p[i] = (uint8_t)(v >> (i * 8));
}
// Named locals rather than `v[a]`: with the working state in an array the
// compiler must keep it addressable and every step becomes a load and a store,
// where sixteen scalars can live in registers.
#define B2B_G(a, b, c, d, x, y)  \
  do {                           \
    a = a + b + (x);             \
    d = ROTR64(d ^ a, 32);       \
    c = c + d;                   \
    b = ROTR64(b ^ c, 24);       \
    a = a + b + (y);             \
    d = ROTR64(d ^ a, 16);       \
    c = c + d;                   \
    b = ROTR64(b ^ c, 63);       \
  } while (0)

/**
 * The BLAKE2b `F` compression function, `rounds` rounds over one 128-byte
 * block. `h` is updated in place.
 */
static void blake2b_f(uint32_t rounds, uint64_t h[8], const uint64_t m[16],
                      const uint64_t t[2], int final) {
  uint64_t v0 = h[0], v1 = h[1], v2 = h[2], v3 = h[3];
  uint64_t v4 = h[4], v5 = h[5], v6 = h[6], v7 = h[7];
  uint64_t v8 = blake2b_iv[0], v9 = blake2b_iv[1];
  uint64_t v10 = blake2b_iv[2], v11 = blake2b_iv[3];
  uint64_t v12 = blake2b_iv[4] ^ t[0], v13 = blake2b_iv[5] ^ t[1];
  uint64_t v14 = blake2b_iv[6], v15 = blake2b_iv[7];
  if (final) v14 = ~v14;
  // The message schedule repeats every ten rounds; EIP-152 allows more, and
  // the round count is attacker-chosen and can reach hundreds of thousands.
  // A wrapping counter rather than `r % 10`, which is a multiply-and-shift the
  // loop pays for every round.
  int sr = 0;
  for (uint32_t r = 0; r < rounds; r++) {
    const uint8_t *sig = blake2b_sigma[sr];
    if (++sr == 10) sr = 0;
    B2B_G(v0, v4, v8, v12, m[sig[0]], m[sig[1]]);
    B2B_G(v1, v5, v9, v13, m[sig[2]], m[sig[3]]);
    B2B_G(v2, v6, v10, v14, m[sig[4]], m[sig[5]]);
    B2B_G(v3, v7, v11, v15, m[sig[6]], m[sig[7]]);
    B2B_G(v0, v5, v10, v15, m[sig[8]], m[sig[9]]);
    B2B_G(v1, v6, v11, v12, m[sig[10]], m[sig[11]]);
    B2B_G(v2, v7, v8, v13, m[sig[12]], m[sig[13]]);
    B2B_G(v3, v4, v9, v14, m[sig[14]], m[sig[15]]);
  }
  h[0] ^= v0 ^ v8;
  h[1] ^= v1 ^ v9;
  h[2] ^= v2 ^ v10;
  h[3] ^= v3 ^ v11;
  h[4] ^= v4 ^ v12;
  h[5] ^= v5 ^ v13;
  h[6] ^= v6 ^ v14;
  h[7] ^= v7 ^ v15;
}

#endif // OX_EVM_PRECOMPILE_H
