// Keccak-256 sponge for the Ox EVM.
//
// The permutation is lifted verbatim from `src/tempo/internal/mine.c`, which is
// already validated against `@noble/hashes` by the VirtualMaster tests. Only
// the sponge around it is new — `mine.c` specializes to a single 52-byte block.

#ifndef OX_EVM_KECCAK_H
#define OX_EVM_KECCAK_H

#include "u256.h"

#define ROTL64(x, n) (((x) << (n)) | ((x) >> (64 - (n))))

static const uint64_t KECCAK_RC[24] = {
    0x0000000000000001ULL, 0x0000000000008082ULL, 0x800000000000808aULL,
    0x8000000080008000ULL, 0x000000000000808bULL, 0x0000000080000001ULL,
    0x8000000080008081ULL, 0x8000000000008009ULL, 0x000000000000008aULL,
    0x0000000000000088ULL, 0x0000000080008009ULL, 0x000000008000000aULL,
    0x000000008000808bULL, 0x800000000000008bULL, 0x8000000000008089ULL,
    0x8000000000008003ULL, 0x8000000000008002ULL, 0x8000000000000080ULL,
    0x000000000000800aULL, 0x800000008000000aULL, 0x8000000080008081ULL,
    0x8000000000008080ULL, 0x0000000080000001ULL, 0x8000000080008008ULL,
};

/**
 * The Keccak-f[1600] permutation, over a lane-complemented state.
 *
 * theta's D, rho's rotation and pi's permutation are fused into one pass into a
 * scratch array — each destination names its source rather than anything being
 * moved — and chi is a second pass back. Four separate passes over the state
 * cost twice the loads and stores.
 *
 * Some lanes are stored complemented. chi is `a ^ (~b & c)`, and a complemented
 * `b` turns that into a plain AND while a complemented `c` turns it into an OR,
 * so most of the NOTs disappear. That matters most where the target has no
 * `andn` instruction, which includes wasm entirely.
 *
 * Generated from the spec's rho offsets and pi mapping, not transcribed. The
 * complement mask comes from an exhaustive search, not from a paper.
 */
// Lanes complemented in the stored representation. Chosen by exhaustive
// search over the 2^25 masks for one that is stable round to round and
// leaves the fewest NOTs in chi: this one frees 18 of the 25 lanes, so a
// round does 7 NOTs instead of 25.
#define KECCAK_COMPLEMENT_MASK { 0, 5, 8, 14, 16, 20 }

static void keccak_f1600(uint64_t *A) {
  uint64_t B[25];
  for (int r = 0; r < 24; r++) {
    const uint64_t c0 = A[0] ^ A[5] ^ A[10] ^ A[15] ^ A[20];
    const uint64_t c1 = A[1] ^ A[6] ^ A[11] ^ A[16] ^ A[21];
    const uint64_t c2 = A[2] ^ A[7] ^ A[12] ^ A[17] ^ A[22];
    const uint64_t c3 = A[3] ^ A[8] ^ A[13] ^ A[18] ^ A[23];
    const uint64_t c4 = A[4] ^ A[9] ^ A[14] ^ A[19] ^ A[24];
    const uint64_t d0 = c4 ^ ROTL64(c1, 1);
    const uint64_t d1 = c0 ^ ROTL64(c2, 1);
    const uint64_t d2 = c1 ^ ROTL64(c3, 1);
    const uint64_t d3 = c2 ^ ROTL64(c4, 1);
    const uint64_t d4 = c3 ^ ROTL64(c0, 1);
    // theta's D, rho's rotation and pi's permutation in one pass: each
    // destination names its source rather than anything being moved.
    B[0] = (A[0] ^ d0);
    B[1] = ROTL64(A[6] ^ d1, 44);
    B[2] = ROTL64(A[12] ^ d2, 43);
    B[3] = ROTL64(A[18] ^ d3, 21);
    B[4] = ROTL64(A[24] ^ d4, 14);
    B[5] = ROTL64(A[3] ^ d3, 28);
    B[6] = ROTL64(A[9] ^ d4, 20);
    B[7] = ROTL64(A[10] ^ d0, 3);
    B[8] = ROTL64(A[16] ^ d1, 45);
    B[9] = ROTL64(A[22] ^ d2, 61);
    B[10] = ROTL64(A[1] ^ d1, 1);
    B[11] = ROTL64(A[7] ^ d2, 6);
    B[12] = ROTL64(A[13] ^ d3, 25);
    B[13] = ROTL64(A[19] ^ d4, 8);
    B[14] = ROTL64(A[20] ^ d0, 18);
    B[15] = ROTL64(A[4] ^ d4, 27);
    B[16] = ROTL64(A[5] ^ d0, 36);
    B[17] = ROTL64(A[11] ^ d1, 10);
    B[18] = ROTL64(A[17] ^ d2, 15);
    B[19] = ROTL64(A[23] ^ d3, 56);
    B[20] = ROTL64(A[2] ^ d2, 62);
    B[21] = ROTL64(A[8] ^ d3, 55);
    B[22] = ROTL64(A[14] ^ d4, 39);
    B[23] = ROTL64(A[15] ^ d0, 41);
    B[24] = ROTL64(A[21] ^ d1, 2);
    // chi. Complemented inputs turn most of the ANDNOTs into a plain AND
    // or OR; the seven that remain each still cost exactly one NOT.
    A[0] = B[0] ^ (B[1] & B[2]) ^ KECCAK_RC[r];
    A[1] = B[1] ^ (B[2] | B[3]);
    A[2] = B[2] ^ (B[3] & B[4]);
    A[3] = B[3] ^ (B[4] | B[0]);
    A[4] = B[4] ^ (B[0] & ~B[1]);
    A[5] = B[5] ^ (~B[6] & B[7]);
    A[6] = B[6] ^ (~B[7] & B[8]);
    A[7] = B[7] ^ (~B[8] & B[9]);
    A[8] = B[8] ^ (B[9] | B[5]);
    A[9] = B[9] ^ (B[5] & B[6]);
    A[10] = B[10] ^ (B[11] | B[12]);
    A[11] = B[11] ^ (B[12] & B[13]);
    A[12] = B[12] ^ (B[13] | B[14]);
    A[13] = B[13] ^ (B[14] & ~B[10]);
    A[14] = B[14] ^ (B[10] & B[11]);
    A[15] = B[15] ^ (B[16] & ~B[17]);
    A[16] = B[16] ^ (B[17] & B[18]);
    A[17] = B[17] ^ (B[18] | B[19]);
    A[18] = B[18] ^ (B[19] & B[15]);
    A[19] = B[19] ^ (B[15] | B[16]);
    A[20] = B[20] ^ (B[21] | B[22]);
    A[21] = B[21] ^ (B[22] & B[23]);
    A[22] = B[22] ^ (B[23] | B[24]);
    A[23] = B[23] ^ (B[24] & B[20]);
    A[24] = B[24] ^ (B[20] | ~B[21]);
  }
}
// NOTs per round: 7

#define KECCAK_RATE 136

// wasm and every target we build for are little-endian, and keccak's lane order
// is little-endian too, so absorbing is a plain unaligned 64-bit load. The
// byte-at-a-time shift-or loops this replaced cost 8 operations per lane, 17
// lanes per block, on both absorb and squeeze.
static inline uint64_t keccak_load64(const uint8_t *p) {
  uint64_t v;
  __builtin_memcpy(&v, p, 8);
  return v;
}

static inline void keccak_store64(uint8_t *p, uint64_t v) {
  __builtin_memcpy(p, &v, 8);
}

/** Keccak-256 (the Ethereum variant, 0x01 padding — not SHA3's 0x06). */
static void keccak256(const uint8_t *in, uint64_t len, uint8_t *out) {
  // Absorbing is a XOR, so it is transparent to the complement; only the empty
  // initial state and the squeezed lanes need converting.
  static const int complemented[] = KECCAK_COMPLEMENT_MASK;
  uint64_t A[25];
  for (int i = 0; i < 25; i++) A[i] = 0;
  for (unsigned i = 0; i < sizeof(complemented) / sizeof(int); i++)
    A[complemented[i]] = ~(uint64_t)0;

  uint64_t off = 0;
  while (len - off >= KECCAK_RATE) {
    for (int i = 0; i < KECCAK_RATE / 8; i++)
      A[i] ^= keccak_load64(in + off + i * 8);
    keccak_f1600(A);
    off += KECCAK_RATE;
  }

  // Absorb the tail lane by lane rather than building a 136-byte block first:
  // the block cost a memset and a memcpy of the whole rate on every hash, which
  // for a 32-byte input is more traffic than the input itself.
  const uint64_t rem = len - off;
  const uint8_t *tail = in + off;
  uint64_t i = 0;
  for (; i + 8 <= rem; i += 8) A[i / 8] ^= keccak_load64(tail + i);
  uint64_t last = 0;
  for (uint64_t k = i; k < rem; k++)
    last |= (uint64_t)tail[k] << ((k - i) * 8);
  // Ethereum pads with 0x01, not SHA3's 0x06, and always sets the rate's top
  // bit. Both land in the same lane when the input is one byte short of the
  // rate, and XOR combines them correctly.
  last |= (uint64_t)0x01 << ((rem - i) * 8);
  A[rem / 8] ^= last;
  A[KECCAK_RATE / 8 - 1] ^= (uint64_t)0x80 << 56;
  keccak_f1600(A);

  uint64_t o[4];
  for (int i = 0; i < 4; i++) o[i] = A[i];
  for (unsigned i = 0; i < sizeof(complemented) / sizeof(int); i++)
    if (complemented[i] < 4) o[complemented[i]] = ~o[complemented[i]];
  for (int i = 0; i < 4; i++) keccak_store64(out + i * 8, o[i]);
}

#endif  // OX_EVM_KECCAK_H
