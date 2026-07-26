// Keccak-f[1600] permutation, fully unrolled.
//
// Extracted verbatim from the TIP-1022 salt miner so that `mine.c` and
// `hashes.c` share one permutation. Everything above the permutation differs
// between them -- `mine.c` hardcodes a single 52-byte block, `hashes.c` absorbs
// arbitrary input -- so only this much is shared.
//
// Based on XKCP / hash-wasm structure.

#ifndef OX_KECCAK_F1600_H
#define OX_KECCAK_F1600_H

#include "ox_rt.h"

#define ROTL64(x, n) (((x) << (n)) | ((x) >> (64 - (n))))

static const uint64_t RC[24] = {
    0x0000000000000001ULL, 0x0000000000008082ULL, 0x800000000000808aULL,
    0x8000000080008000ULL, 0x000000000000808bULL, 0x0000000080000001ULL,
    0x8000000080008081ULL, 0x8000000000008009ULL, 0x000000000000008aULL,
    0x0000000000000088ULL, 0x0000000080008009ULL, 0x000000008000000aULL,
    0x000000008000808bULL, 0x800000000000008bULL, 0x8000000000008089ULL,
    0x8000000000008003ULL, 0x8000000000008002ULL, 0x8000000000000080ULL,
    0x000000000000800aULL, 0x800000008000000aULL, 0x8000000080008081ULL,
    0x8000000000008080ULL, 0x0000000080000001ULL, 0x8000000080008008ULL,
};

// Theta — fully unrolled column parity + diffusion
#define XORED(i) (A[(i)] ^ A[(i)+5] ^ A[(i)+10] ^ A[(i)+15] ^ A[(i)+20])

static inline void theta(uint64_t *A) {
    uint64_t D[5];
    D[0] = ROTL64(XORED(1), 1) ^ XORED(4);
    D[1] = ROTL64(XORED(2), 1) ^ XORED(0);
    D[2] = ROTL64(XORED(3), 1) ^ XORED(1);
    D[3] = ROTL64(XORED(4), 1) ^ XORED(2);
    D[4] = ROTL64(XORED(0), 1) ^ XORED(3);
    A[ 0]^=D[0]; A[ 1]^=D[1]; A[ 2]^=D[2]; A[ 3]^=D[3]; A[ 4]^=D[4];
    A[ 5]^=D[0]; A[ 6]^=D[1]; A[ 7]^=D[2]; A[ 8]^=D[3]; A[ 9]^=D[4];
    A[10]^=D[0]; A[11]^=D[1]; A[12]^=D[2]; A[13]^=D[3]; A[14]^=D[4];
    A[15]^=D[0]; A[16]^=D[1]; A[17]^=D[2]; A[18]^=D[3]; A[19]^=D[4];
    A[20]^=D[0]; A[21]^=D[1]; A[22]^=D[2]; A[23]^=D[3]; A[24]^=D[4];
}

// Rho — explicit per-lane rotations with compile-time constants
static inline void rho(uint64_t *A) {
    A[ 1] = ROTL64(A[ 1],  1); A[ 2] = ROTL64(A[ 2], 62);
    A[ 3] = ROTL64(A[ 3], 28); A[ 4] = ROTL64(A[ 4], 27);
    A[ 5] = ROTL64(A[ 5], 36); A[ 6] = ROTL64(A[ 6], 44);
    A[ 7] = ROTL64(A[ 7],  6); A[ 8] = ROTL64(A[ 8], 55);
    A[ 9] = ROTL64(A[ 9], 20); A[10] = ROTL64(A[10],  3);
    A[11] = ROTL64(A[11], 10); A[12] = ROTL64(A[12], 43);
    A[13] = ROTL64(A[13], 25); A[14] = ROTL64(A[14], 39);
    A[15] = ROTL64(A[15], 41); A[16] = ROTL64(A[16], 45);
    A[17] = ROTL64(A[17], 15); A[18] = ROTL64(A[18], 21);
    A[19] = ROTL64(A[19],  8); A[20] = ROTL64(A[20], 18);
    A[21] = ROTL64(A[21],  2); A[22] = ROTL64(A[22], 61);
    A[23] = ROTL64(A[23], 56); A[24] = ROTL64(A[24], 14);
}

// Pi — single-temporary rotation chain (no scratch buffer)
static inline void pi(uint64_t *A) {
    uint64_t A1 = A[1];
    A[ 1]=A[ 6]; A[ 6]=A[ 9]; A[ 9]=A[22]; A[22]=A[14]; A[14]=A[20];
    A[20]=A[ 2]; A[ 2]=A[12]; A[12]=A[13]; A[13]=A[19]; A[19]=A[23];
    A[23]=A[15]; A[15]=A[ 4]; A[ 4]=A[24]; A[24]=A[21]; A[21]=A[ 8];
    A[ 8]=A[16]; A[16]=A[ 5]; A[ 5]=A[ 3]; A[ 3]=A[18]; A[18]=A[17];
    A[17]=A[11]; A[11]=A[ 7]; A[ 7]=A[10]; A[10]=A1;
}

// Chi — unrolled nonlinear step
#define CHI_ROW(i) { \
    uint64_t a0 = A[(i)], a1 = A[(i)+1]; \
    A[(i)  ] ^= ~a1        & A[(i)+2]; \
    A[(i)+1] ^= ~A[(i)+2]  & A[(i)+3]; \
    A[(i)+2] ^= ~A[(i)+3]  & A[(i)+4]; \
    A[(i)+3] ^= ~A[(i)+4]  & a0;       \
    A[(i)+4] ^= ~a0        & a1;       \
}

static inline void chi(uint64_t *A) {
    CHI_ROW(0); CHI_ROW(5); CHI_ROW(10); CHI_ROW(15); CHI_ROW(20);
}

static void keccak_f1600(uint64_t *A) {
    for (int r = 0; r < 24; r++) {
        theta(A); rho(A); pi(A); chi(A);
        A[0] ^= RC[r];
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

static inline uint64_t load64_le(const uint8_t *p) {
    return (uint64_t)p[0]       | ((uint64_t)p[1] << 8)  |
           ((uint64_t)p[2] <<16)| ((uint64_t)p[3] << 24) |
           ((uint64_t)p[4] <<32)| ((uint64_t)p[5] << 40) |
           ((uint64_t)p[6] <<48)| ((uint64_t)p[7] << 56);
}

static inline void store64_le(uint8_t *p, uint64_t v) {
    p[0]=(uint8_t)v; p[1]=(uint8_t)(v>>8); p[2]=(uint8_t)(v>>16); p[3]=(uint8_t)(v>>24);
    p[4]=(uint8_t)(v>>32); p[5]=(uint8_t)(v>>40); p[6]=(uint8_t)(v>>48); p[7]=(uint8_t)(v>>56);
}

static inline uint32_t load32_le(const uint8_t *p) {
    return (uint32_t)p[0] | ((uint32_t)p[1]<<8) | ((uint32_t)p[2]<<16) | ((uint32_t)p[3]<<24);
}

#endif // OX_KECCAK_F1600_H
