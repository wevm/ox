// Keccak-256 sponge for the Ox EVM.
//
// The permutation started as the hand-unrolled keccak-f1600 from
// `src/tempo/internal/mine.c`, which the VirtualMaster tests already validate
// against `@noble/hashes`. Only the sponge around it was new — `mine.c`
// specializes to a single 52-byte block.

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

// Lanes complemented in the stored representation. Chosen by exhaustive search
// over the 2^25 masks for one that is stable round to round and leaves the
// fewest NOTs in chi: this one frees 18 of the 25 lanes, so a round does 7 NOTs
// instead of 25.
//
// chi is `a ^ (~b & c)`. A complemented `b` turns that into a plain AND and a
// complemented `c` turns it into an OR, so most of the NOTs disappear. That
// matters where the target has no `andn` instruction, which includes wasm
// entirely and baseline x86-64. eprint.iacr.org/2024/1515 reaches the same
// conclusion about lane complementing, and rules out bit interleaving here:
// wasm32 has a native `i64.rotl`, so there is nothing to work around.
#define KECCAK_COMPLEMENT_MASK { 0, 5, 8, 14, 16, 20 }

/**
 * One round, reading the 25 lanes named `S0..S24` and writing `T0..T24`.
 *
 * theta's D, rho's rotation, pi's permutation and chi are fused: each
 * destination names its source rather than anything being moved. Only five `b`
 * temporaries are live at a time, one output row's worth — materializing all 25
 * at once, which is the obvious way to write this, puts ~75 values in flight and
 * spills hard on a 16-register machine.
 *
 * Reads `c0..c4`, the column parities of `S`, from the enclosing scope.
 * Accumulating those from the outputs as they are written (XKCP's
 * `prepareTheta`) was measured and is slower: it stretches five live values
 * across the whole round to save a pass over lanes that are already hot.
 *
 * Generated from the spec's rho offsets and pi mapping, not transcribed.
 */
#define KECCAK_ROUND(S, T, RC)                    \
  do {                                            \
    const uint64_t d0 = c4 ^ ROTL64(c1, 1);       \
    const uint64_t d1 = c0 ^ ROTL64(c2, 1);       \
    const uint64_t d2 = c1 ^ ROTL64(c3, 1);       \
    const uint64_t d3 = c2 ^ ROTL64(c4, 1);       \
    const uint64_t d4 = c3 ^ ROTL64(c0, 1);       \
    {                                             \
      const uint64_t b0 = (S##0 ^ d0);            \
      const uint64_t b1 = ROTL64(S##6 ^ d1, 44);  \
      const uint64_t b2 = ROTL64(S##12 ^ d2, 43); \
      const uint64_t b3 = ROTL64(S##18 ^ d3, 21); \
      const uint64_t b4 = ROTL64(S##24 ^ d4, 14); \
      T##0 = b0 ^ (b1 & b2) ^ (RC);               \
      T##1 = b1 ^ (b2 | b3);                      \
      T##2 = b2 ^ (b3 & b4);                      \
      T##3 = b3 ^ (b4 | b0);                      \
      T##4 = b4 ^ (b0 & ~b1);                     \
    }                                             \
    {                                             \
      const uint64_t b0 = ROTL64(S##3 ^ d3, 28);  \
      const uint64_t b1 = ROTL64(S##9 ^ d4, 20);  \
      const uint64_t b2 = ROTL64(S##10 ^ d0, 3);  \
      const uint64_t b3 = ROTL64(S##16 ^ d1, 45); \
      const uint64_t b4 = ROTL64(S##22 ^ d2, 61); \
      T##5 = b0 ^ (~b1 & b2);                     \
      T##6 = b1 ^ (~b2 & b3);                     \
      T##7 = b2 ^ (~b3 & b4);                     \
      T##8 = b3 ^ (b4 | b0);                      \
      T##9 = b4 ^ (b0 & b1);                      \
    }                                             \
    {                                             \
      const uint64_t b0 = ROTL64(S##1 ^ d1, 1);   \
      const uint64_t b1 = ROTL64(S##7 ^ d2, 6);   \
      const uint64_t b2 = ROTL64(S##13 ^ d3, 25); \
      const uint64_t b3 = ROTL64(S##19 ^ d4, 8);  \
      const uint64_t b4 = ROTL64(S##20 ^ d0, 18); \
      T##10 = b0 ^ (b1 | b2);                     \
      T##11 = b1 ^ (b2 & b3);                     \
      T##12 = b2 ^ (b3 | b4);                     \
      T##13 = b3 ^ (b4 & ~b0);                    \
      T##14 = b4 ^ (b0 & b1);                     \
    }                                             \
    {                                             \
      const uint64_t b0 = ROTL64(S##4 ^ d4, 27);  \
      const uint64_t b1 = ROTL64(S##5 ^ d0, 36);  \
      const uint64_t b2 = ROTL64(S##11 ^ d1, 10); \
      const uint64_t b3 = ROTL64(S##17 ^ d2, 15); \
      const uint64_t b4 = ROTL64(S##23 ^ d3, 56); \
      T##15 = b0 ^ (b1 & ~b2);                    \
      T##16 = b1 ^ (b2 & b3);                     \
      T##17 = b2 ^ (b3 | b4);                     \
      T##18 = b3 ^ (b4 & b0);                     \
      T##19 = b4 ^ (b0 | b1);                     \
    }                                             \
    {                                             \
      const uint64_t b0 = ROTL64(S##2 ^ d2, 62);  \
      const uint64_t b1 = ROTL64(S##8 ^ d3, 55);  \
      const uint64_t b2 = ROTL64(S##14 ^ d4, 39); \
      const uint64_t b3 = ROTL64(S##15 ^ d0, 41); \
      const uint64_t b4 = ROTL64(S##21 ^ d1, 2);  \
      T##20 = b0 ^ (b1 | b2);                     \
      T##21 = b1 ^ (b2 & b3);                     \
      T##22 = b2 ^ (b3 | b4);                     \
      T##23 = b3 ^ (b4 & b0);                     \
      T##24 = b4 ^ (b0 | ~b1);                    \
    }                                             \
  } while (0)

#define KECCAK_LANES(p)                                                     \
  uint64_t p##0, p##1, p##2, p##3, p##4, p##5, p##6, p##7, p##8, p##9,      \
      p##10, p##11, p##12, p##13, p##14, p##15, p##16, p##17, p##18,        \
      p##19, p##20, p##21, p##22, p##23, p##24

#define KECCAK_COLUMNS(p)          \
  c0 = p##0 ^ p##5 ^ p##10 ^ p##15 ^ p##20; \
  c1 = p##1 ^ p##6 ^ p##11 ^ p##16 ^ p##21; \
  c2 = p##2 ^ p##7 ^ p##12 ^ p##17 ^ p##22; \
  c3 = p##3 ^ p##8 ^ p##13 ^ p##18 ^ p##23; \
  c4 = p##4 ^ p##9 ^ p##14 ^ p##19 ^ p##24

/** The body of the permutation, so it can be instantiated per target below. */
#define KECCAK_PERMUTE(A)                                                   \
  do {                                                                      \
    /* Two rounds per iteration, with the two lane sets swapping roles, so  \
       the state is never copied back. */                                   \
    KECCAK_LANES(a);                                                        \
    KECCAK_LANES(e);                                                        \
    uint64_t c0, c1, c2, c3, c4;                                            \
    a0 = A[0];   a1 = A[1];   a2 = A[2];   a3 = A[3];   a4 = A[4];          \
    a5 = A[5];   a6 = A[6];   a7 = A[7];   a8 = A[8];   a9 = A[9];          \
    a10 = A[10]; a11 = A[11]; a12 = A[12]; a13 = A[13]; a14 = A[14];        \
    a15 = A[15]; a16 = A[16]; a17 = A[17]; a18 = A[18]; a19 = A[19];        \
    a20 = A[20]; a21 = A[21]; a22 = A[22]; a23 = A[23]; a24 = A[24];        \
    for (int r = 0; r < 24; r += 2) {                                       \
      KECCAK_COLUMNS(a);                                                    \
      KECCAK_ROUND(a, e, KECCAK_RC[r]);                                     \
      KECCAK_COLUMNS(e);                                                    \
      KECCAK_ROUND(e, a, KECCAK_RC[r + 1]);                                 \
    }                                                                       \
    A[0] = a0;   A[1] = a1;   A[2] = a2;   A[3] = a3;   A[4] = a4;          \
    A[5] = a5;   A[6] = a6;   A[7] = a7;   A[8] = a8;   A[9] = a9;          \
    A[10] = a10; A[11] = a11; A[12] = a12; A[13] = a13; A[14] = a14;        \
    A[15] = a15; A[16] = a16; A[17] = a17; A[18] = a18; A[19] = a19;        \
    A[20] = a20; A[21] = a21; A[22] = a22; A[23] = a23; A[24] = a24;        \
  } while (0)

// Baseline x86-64 has no `andn`, so the seven NOTs the complement mask leaves
// behind cost seven extra instructions per round. Compiling a second copy for
// x86-64-v3 and picking between them recovers that, and is the same bargain
// the hand-written assembly this competes with makes.
//
// The choice is an explicit branch on a `__builtin_cpu_supports` flag — a
// predictable test against a preinitialized global, next to nothing beside a
// 300ns permutation — rather than `target_clones`. `target_clones` builds an
// IFUNC, and the PLT that comes with it measurably perturbs the rest of the
// translation unit: the two pure-dispatch benchmarks, which never hash
// anything, lost 5-8% to it.
//
// Everything else, wasm included, gets the single baseline definition.
#if defined(__x86_64__) && !defined(OX_NO_MULTIVERSION)
__attribute__((noinline, target("arch=x86-64-v3"))) static void
keccak_f1600_v3(uint64_t *A) {
  KECCAK_PERMUTE(A);
}
#endif

/**
 * The Keccak-f[1600] permutation, over a lane-complemented state.
 *
 * Kept out of line deliberately. Inlined, its straight-line code lands inside
 * the interpreter's dispatch loop and moves everything after it.
 */
__attribute__((noinline)) static void keccak_f1600(uint64_t *A) {
#if defined(__x86_64__) && !defined(OX_NO_MULTIVERSION)
  if (__builtin_cpu_supports("avx2")) { // implies BMI1/BMI2, i.e. x86-64-v3
    keccak_f1600_v3(A);
    return;
  }
#endif
  KECCAK_PERMUTE(A);
}

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
