// Precompiled contracts implementable without elliptic-curve arithmetic.
//
// ecrecover (0x01), the bn254 pair (0x06-0x08), KZG (0x0a), and the BLS12-381
// set (0x0b-0x11) need field and group arithmetic that does not belong in this
// file; they are reported as unsupported so the caller can tell "wrong answer"
// apart from "not implemented".

#ifndef OX_EVM_PRECOMPILE_H
#define OX_EVM_PRECOMPILE_H

#include "keccak.h"
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

static void sha256(const uint8_t *in, uint64_t len, uint8_t *out) {
  uint32_t h[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                   0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
  const uint64_t bits = len * 8;
  // One pass over the message plus the padded tail, which is one block unless
  // the length byte-count spills past 56.
  const uint64_t total = len + 1 + ((len % 64) < 56 ? (55 - (len % 64))
                                                    : (119 - (len % 64))) + 8;
  for (uint64_t off = 0; off < total; off += 64) {
    uint8_t block[64];
    for (int i = 0; i < 64; i++) {
      const uint64_t p = off + (uint64_t)i;
      if (p < len) block[i] = in[p];
      else if (p == len) block[i] = 0x80;
      else if (p + 8 >= total) block[i] = (uint8_t)(bits >> ((total - 1 - p) * 8));
      else block[i] = 0;
    }
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

static void ripemd160(const uint8_t *in, uint64_t len, uint8_t *out) {
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

  uint32_t h[5] = {0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0};
  const uint64_t bits = len * 8;
  const uint64_t total = len + 1 + ((len % 64) < 56 ? (55 - (len % 64))
                                                    : (119 - (len % 64))) + 8;
  for (uint64_t off = 0; off < total; off += 64) {
    uint32_t x[16];
    for (int i = 0; i < 16; i++) {
      uint32_t v = 0;
      for (int j = 3; j >= 0; j--) {
        const uint64_t p = off + (uint64_t)i * 4 + (uint64_t)j;
        uint8_t byte;
        if (p < len) byte = in[p];
        else if (p == len) byte = 0x80;
        // The length is little-endian in the final eight bytes.
        else if (p + 8 >= total) byte = (uint8_t)(bits >> ((p - (total - 8)) * 8));
        else byte = 0;
        v = (v << 8) | byte;
      }
      x[i] = v;
    }
    uint32_t al = h[0], bl = h[1], cl = h[2], dl = h[3], el = h[4];
    uint32_t ar = h[0], br = h[1], cr = h[2], dr = h[3], er = h[4];
    for (int i = 0; i < 80; i++) {
      const int r = i / 16;
      uint32_t f, g;
      switch (r) {
        case 0: f = bl ^ cl ^ dl; break;
        case 1: f = (bl & cl) | (~bl & dl); break;
        case 2: f = (bl | ~cl) ^ dl; break;
        case 3: f = (bl & dl) | (cl & ~dl); break;
        default: f = bl ^ (cl | ~dl); break;
      }
      uint32_t t = ROTL32(al + f + x[rl[i]] + kl[r], sl[i]) + el;
      al = el; el = dl; dl = ROTL32(cl, 10); cl = bl; bl = t;
      switch (r) {
        case 0: g = br ^ (cr | ~dr); break;
        case 1: g = (br & dr) | (cr & ~dr); break;
        case 2: g = (br | ~cr) ^ dr; break;
        case 3: g = (br & cr) | (~br & dr); break;
        default: g = br ^ cr ^ dr; break;
      }
      t = ROTL32(ar + g + x[rr[i]] + kr[r], sr[i]) + er;
      ar = er; er = dr; dr = ROTL32(cr, 10); cr = br; br = t;
    }
    const uint32_t t = h[1] + cl + dr;
    h[1] = h[2] + dl + er;
    h[2] = h[3] + el + ar;
    h[3] = h[4] + al + br;
    h[4] = h[0] + bl + cr;
    h[0] = t;
  }
  // The 20-byte digest is left-aligned in a 32-byte output word.
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

#define MODEXP_LIMBS 128 // 1024 bytes, the practical ceiling for these tests

typedef struct {
  uint32_t d[MODEXP_LIMBS];
  int n;
} bignum;

static void bn_from_be(bignum *r, const uint8_t *p, uint64_t len) {
  for (int i = 0; i < MODEXP_LIMBS; i++) r->d[i] = 0;
  r->n = 0;
  if (len > MODEXP_LIMBS * 4) len = MODEXP_LIMBS * 4;
  for (uint64_t i = 0; i < len; i++) {
    const uint64_t shift = (len - 1 - i) * 8;
    r->d[shift / 32] |= (uint32_t)p[i] << (shift % 32);
  }
  for (int i = MODEXP_LIMBS - 1; i >= 0; i--)
    if (r->d[i]) { r->n = i + 1; break; }
}

static int bn_is_zero(const bignum *a) { return a->n == 0; }

/** `r = a * b mod m`, schoolbook with a reduce-by-subtraction step. */
static void bn_mulmod(bignum *r, const bignum *a, const bignum *b,
                      const bignum *m) {
  uint32_t t[MODEXP_LIMBS * 2 + 2];
  const int tn = m->n * 2 + 2 > MODEXP_LIMBS * 2 ? MODEXP_LIMBS * 2 : m->n * 2 + 2;
  for (int i = 0; i < tn; i++) t[i] = 0;
  for (int i = 0; i < a->n; i++) {
    uint64_t carry = 0;
    for (int j = 0; j < b->n && i + j < tn; j++) {
      const uint64_t cur = (uint64_t)t[i + j] + (uint64_t)a->d[i] * b->d[j] + carry;
      t[i + j] = (uint32_t)cur;
      carry = cur >> 32;
    }
    for (int k = i + b->n; carry && k < tn; k++) {
      const uint64_t cur = (uint64_t)t[k] + carry;
      t[k] = (uint32_t)cur;
      carry = cur >> 32;
    }
  }
  // Long division by `m`, one bit at a time from the top.
  bignum rem;
  for (int i = 0; i < MODEXP_LIMBS; i++) rem.d[i] = 0;
  rem.n = 0;
  for (int bit = tn * 32 - 1; bit >= 0; bit--) {
    // rem = rem*2 + bit
    uint32_t carry = (t[bit / 32] >> (bit % 32)) & 1;
    for (int i = 0; i < m->n + 1 && i < MODEXP_LIMBS; i++) {
      const uint32_t next = rem.d[i] >> 31;
      rem.d[i] = (rem.d[i] << 1) | carry;
      carry = next;
    }
    rem.n = 0;
    for (int i = MODEXP_LIMBS - 1; i >= 0; i--)
      if (rem.d[i]) { rem.n = i + 1; break; }
    // Subtract m if rem >= m.
    int ge = rem.n > m->n;
    if (rem.n == m->n) {
      ge = 1;
      for (int i = m->n - 1; i >= 0; i--) {
        if (rem.d[i] != m->d[i]) { ge = rem.d[i] > m->d[i]; break; }
      }
    }
    if (ge) {
      int64_t borrow = 0;
      for (int i = 0; i < m->n; i++) {
        const int64_t diff = (int64_t)rem.d[i] - m->d[i] - borrow;
        rem.d[i] = (uint32_t)diff;
        borrow = diff < 0;
      }
      for (int i = m->n; borrow && i < MODEXP_LIMBS; i++) {
        const int64_t diff = (int64_t)rem.d[i] - borrow;
        rem.d[i] = (uint32_t)diff;
        borrow = diff < 0;
      }
      rem.n = 0;
      for (int i = MODEXP_LIMBS - 1; i >= 0; i--)
        if (rem.d[i]) { rem.n = i + 1; break; }
    }
  }
  *r = rem;
}

/** EIP-198 `base^exp mod modulus`, big-endian in and out. */
static void modexp(const uint8_t *base, uint64_t bl, const uint8_t *exp,
                   uint64_t el, const uint8_t *mod, uint64_t ml, uint8_t *out) {
  bignum b, m, acc;
  bn_from_be(&b, base, bl);
  bn_from_be(&m, mod, ml);
  for (uint64_t i = 0; i < ml; i++) out[i] = 0;
  if (bn_is_zero(&m)) return;
  // Result is zero mod 1, and the loop below assumes a multi-bit modulus.
  if (m.n == 1 && m.d[0] == 1) return;

  for (int i = 0; i < MODEXP_LIMBS; i++) acc.d[i] = 0;
  acc.d[0] = 1;
  acc.n = 1;
  bignum sq = b;
  {
    // Reduce the base first so the squaring chain stays bounded.
    bignum one;
    for (int i = 0; i < MODEXP_LIMBS; i++) one.d[i] = 0;
    one.d[0] = 1;
    one.n = 1;
    bn_mulmod(&sq, &b, &one, &m);
  }
  for (int64_t byte = (int64_t)el - 1; byte >= 0; byte--) {
    const uint8_t e = exp[byte];
    for (int bit = 0; bit < 8; bit++) {
      if ((e >> bit) & 1) bn_mulmod(&acc, &acc, &sq, &m);
      // Skip the final squaring once no higher bits remain.
      if (byte == 0 && bit == 7) break;
      bn_mulmod(&sq, &sq, &sq, &m);
    }
  }
  for (uint64_t i = 0; i < ml; i++) {
    const uint64_t shift = (ml - 1 - i) * 8;
    const uint64_t limb = shift / 32;
    out[i] = limb < MODEXP_LIMBS ? (uint8_t)(acc.d[limb] >> (shift % 32)) : 0;
  }
}

#endif // OX_EVM_PRECOMPILE_H
