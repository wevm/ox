// Hash primitives for the `Hash` engine slot.
//
// Every export takes explicit pointers and lengths: JS owns the memory above
// `heap_base`, writes the input there, and reads the digest back out. There are
// no fixed offsets and no allocation.
//
// Exports:
//   keccak256(in, len, out32)
//   keccak256_init(state344)
//   keccak256_update(state344, in, len)
//   keccak256_finalize(state344, out32)
//   sha256(in, len, out32)
//   sha256_init(state112)
//   sha256_update(state112, in, len)
//   sha256_finalize(state112, out32)
//   ripemd160(in, len, out20)
//   ripemd160_init(state96)
//   ripemd160_update(state96, in, len)
//   ripemd160_finalize(state96, out20)
//   hmac_sha256(key, keyLen, msg, msgLen, out32, scratch144)
//   hmac_sha256_init(state144, key, keyLen)
//   hmac_sha256_update(state144, in, len)
//   hmac_sha256_finalize(state144, out32)
//   pbkdf2_sha256(password, passwordLen, saltAndCounter, saltLen, iterations,
//                 out, outLen, scratch352)

#include "keccak_f1600.h"
#include "ox_rt.h"

__attribute__((noinline))
static void hashes_zero(uint8_t *ptr, uint32_t len) {
    ox_zero(ptr, len);
}

// Keccak256 — rate 136 bytes, 0x01 domain padding (not FIPS-202's 0x06).

#define KECCAK256_RATE 136

/**
 * Applies Keccak-f[1600] to a 200-byte state in place.
 *
 * Exported only so the permutation can be checked against the Keccak team's own
 * reference values (`test/vectors/hashes/KeccakF-1600-IntermediateValues.txt`).
 * It is the shared core of this file and `mine.c`, and `mine.c`'s specialized
 * single-block path is not covered by any published digest vector -- so this is
 * the only way to test that core directly, and to localize a regression to a
 * specific round when someone edits the unrolled macros.
 */
__attribute__((noinline))
static void keccak256_permute(uint64_t *A) {
    keccak_f1600(A);
}

__attribute__((export_name("keccak_f1600")))
void ox_keccak_f1600(uint8_t *state) {
    uint64_t A[25];
    for (int i = 0; i < 25; i++) A[i] = load64_le(state + i * 8);
    keccak256_permute(A);
    for (int i = 0; i < 25; i++) store64_le(state + i * 8, A[i]);
}

static void keccak256_absorb(uint64_t *A, const uint8_t *block) {
    for (int i = 0; i < KECCAK256_RATE / 8; i++)
        A[i] ^= load64_le(block + i * 8);
}

struct keccak256_state {
    uint64_t A[25];
    uint32_t buffered;
    uint8_t block[KECCAK256_RATE];
};

_Static_assert(
    sizeof(struct keccak256_state) == KECCAK256_STATE_SIZE,
    "Keccak256 state size must match the loader");

__attribute__((noinline, export_name("keccak256_init")))
void ox_keccak256_init(struct keccak256_state *state) {
    for (int i = 0; i < 25; i++) state->A[i] = 0;
    state->buffered = 0;
    for (int i = 0; i < KECCAK256_RATE; i++) state->block[i] = 0;
}

__attribute__((noinline, export_name("keccak256_update")))
void ox_keccak256_update(struct keccak256_state *state, const uint8_t *in,
                         uint32_t len) {
    uint32_t offset = 0;

    if (state->buffered) {
        const uint32_t available = KECCAK256_RATE - state->buffered;
        const uint32_t take = len < available ? len : available;
        for (uint32_t i = 0; i < take; i++)
            state->block[state->buffered + i] = in[i];
        state->buffered += take;
        offset += take;

        if (state->buffered == KECCAK256_RATE) {
            keccak256_absorb(state->A, state->block);
            keccak256_permute(state->A);
            state->buffered = 0;
        }
        if (offset == len) return;
    }

    while (len - offset >= KECCAK256_RATE) {
        keccak256_absorb(state->A, in + offset);
        keccak256_permute(state->A);
        offset += KECCAK256_RATE;
    }

    const uint32_t remaining = len - offset;
    for (uint32_t i = 0; i < remaining; i++)
        state->block[i] = in[offset + i];
    state->buffered = remaining;
}

__attribute__((noinline, export_name("keccak256_finalize")))
void ox_keccak256_finalize(struct keccak256_state *state, uint8_t *out) {
    for (uint32_t i = state->buffered; i < KECCAK256_RATE; i++)
        state->block[i] = 0;
    state->block[state->buffered] = 0x01;
    state->block[KECCAK256_RATE - 1] |= 0x80;
    keccak256_absorb(state->A, state->block);
    keccak256_permute(state->A);

    for (int i = 0; i < 4; i++) store64_le(out + i * 8, state->A[i]);
}

__attribute__((export_name("keccak256")))
void ox_keccak256(const uint8_t *in, uint32_t len, uint8_t *out) {
    struct keccak256_state state;
    ox_keccak256_init(&state);
    ox_keccak256_update(&state, in, len);
    ox_keccak256_finalize(&state, out);
}

// SHA-256 — FIPS 180-4.

#define ROTR32(x, n) (((x) >> (n)) | ((x) << (32 - (n))))

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
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
};

static uint32_t load32_be(const uint8_t *p) {
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) |
           ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

static void store32_be(uint8_t *p, uint32_t v) {
    p[0] = (uint8_t)(v >> 24); p[1] = (uint8_t)(v >> 16);
    p[2] = (uint8_t)(v >> 8);  p[3] = (uint8_t)v;
}

__attribute__((noinline))
static void sha256_compress(uint32_t *H, const uint8_t *block, uint32_t *W) {
    for (int i = 0; i < 16; i++) W[i] = load32_be(block + i * 4);
    for (int i = 16; i < 64; i++) {
        const uint32_t s0 =
            ROTR32(W[i - 15], 7) ^ ROTR32(W[i - 15], 18) ^ (W[i - 15] >> 3);
        const uint32_t s1 =
            ROTR32(W[i - 2], 17) ^ ROTR32(W[i - 2], 19) ^ (W[i - 2] >> 10);
        W[i] = W[i - 16] + s0 + W[i - 7] + s1;
    }

    uint32_t a = H[0], b = H[1], c = H[2], d = H[3];
    uint32_t e = H[4], f = H[5], g = H[6], h = H[7];

    for (int i = 0; i < 64; i++) {
        const uint32_t S1 = ROTR32(e, 6) ^ ROTR32(e, 11) ^ ROTR32(e, 25);
        const uint32_t ch = (e & f) ^ (~e & g);
        const uint32_t t1 = h + S1 + ch + SHA256_K[i] + W[i];
        const uint32_t S0 = ROTR32(a, 2) ^ ROTR32(a, 13) ^ ROTR32(a, 22);
        const uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
        const uint32_t t2 = S0 + maj;
        h = g; g = f; f = e; e = d + t1;
        d = c; c = b; b = a; a = t1 + t2;
    }

    H[0] += a; H[1] += b; H[2] += c; H[3] += d;
    H[4] += e; H[5] += f; H[6] += g; H[7] += h;
}

static void sha256_init_words(uint32_t *H) {
    H[0] = 0x6a09e667; H[1] = 0xbb67ae85;
    H[2] = 0x3c6ef372; H[3] = 0xa54ff53a;
    H[4] = 0x510e527f; H[5] = 0x9b05688c;
    H[6] = 0x1f83d9ab; H[7] = 0x5be0cd19;
}

struct sha256_state {
    uint64_t length;
    uint32_t H[8];
    uint32_t buffered;
    uint8_t block[64];
};

_Static_assert(
    sizeof(struct sha256_state) == SHA256_STATE_SIZE,
    "SHA-256 state size must match the loader");

__attribute__((noinline))
static void sha256_state_init(struct sha256_state *state) {
    state->length = 0;
    sha256_init_words(state->H);
    state->buffered = 0;
    for (int i = 0; i < 64; i++) state->block[i] = 0;
}

__attribute__((noinline))
static void sha256_state_update(struct sha256_state *state, const uint8_t *in,
                                uint32_t len) {
    uint32_t W[64];
    uint32_t offset = 0;
    state->length += len;

    if (state->buffered) {
        const uint32_t available = 64 - state->buffered;
        const uint32_t take = len < available ? len : available;
        for (uint32_t i = 0; i < take; i++)
            state->block[state->buffered + i] = in[i];
        state->buffered += take;
        offset += take;

        if (state->buffered == 64) {
            sha256_compress(state->H, state->block, W);
            state->buffered = 0;
        }
        if (offset == len) {
            hashes_zero((uint8_t *)W, sizeof(W));
            return;
        }
    }

    while (len - offset >= 64) {
        sha256_compress(state->H, in + offset, W);
        offset += 64;
    }

    const uint32_t remaining = len - offset;
    for (uint32_t i = 0; i < remaining; i++)
        state->block[i] = in[offset + i];
    state->buffered = remaining;
    hashes_zero((uint8_t *)W, sizeof(W));
}

__attribute__((noinline))
static void sha256_state_finalize(struct sha256_state *state, uint8_t *out) {
    uint8_t block[128];
    uint32_t W[64];
    const uint32_t total = state->buffered >= 56 ? 128 : 64;

    for (uint32_t i = 0; i < total; i++) block[i] = 0;
    for (uint32_t i = 0; i < state->buffered; i++)
        block[i] = state->block[i];
    block[state->buffered] = 0x80;

    const uint64_t bits = state->length * 8;
    for (int i = 0; i < 8; i++)
        block[total - 1 - i] = (uint8_t)(bits >> (i * 8));

    sha256_compress(state->H, block, W);
    if (total == 128) sha256_compress(state->H, block + 64, W);
    for (int i = 0; i < 8; i++) store32_be(out + i * 4, state->H[i]);

    hashes_zero(block, sizeof(block));
    hashes_zero((uint8_t *)W, sizeof(W));
}

__attribute__((export_name("sha256_init")))
void ox_sha256_init(struct sha256_state *state) {
    sha256_state_init(state);
}

__attribute__((export_name("sha256_update")))
void ox_sha256_update(struct sha256_state *state, const uint8_t *in,
                      uint32_t len) {
    sha256_state_update(state, in, len);
}

__attribute__((export_name("sha256_finalize")))
void ox_sha256_finalize(struct sha256_state *state, uint8_t *out) {
    sha256_state_finalize(state, out);
}

__attribute__((export_name("sha256")))
void ox_sha256(const uint8_t *in, uint32_t len, uint8_t *out) {
    struct sha256_state state;
    sha256_state_init(&state);
    sha256_state_update(&state, in, len);
    sha256_state_finalize(&state, out);
}

// HMAC-SHA256 — RFC 2104.

struct hmac_sha256_state {
    struct sha256_state inner;
    uint32_t outerH[8];
};

_Static_assert(
    sizeof(struct hmac_sha256_state) == HMAC_SHA256_STATE_SIZE,
    "HMAC-SHA256 state size must match the loader");

_Static_assert(
    sizeof(struct hmac_sha256_state) == HMAC_SHA256_SCRATCH_SIZE,
    "HMAC-SHA256 scratch size must match the loader");

__attribute__((noinline))
static void hmac_sha256_state_init(struct hmac_sha256_state *state,
                                   const uint8_t *key, uint32_t keyLen) {
    uint8_t pad[64];
    for (int i = 0; i < 64; i++) pad[i] = 0;
    if (keyLen > 64) {
        struct sha256_state keyState;
        sha256_state_init(&keyState);
        sha256_state_update(&keyState, key, keyLen);
        sha256_state_finalize(&keyState, pad);
        hashes_zero((uint8_t *)&keyState, sizeof(keyState));
    } else for (uint32_t i = 0; i < keyLen; i++) pad[i] = key[i];

    sha256_state_init(&state->inner);
    for (int i = 0; i < 64; i++) pad[i] ^= 0x36;
    sha256_state_update(&state->inner, pad, 64);

    struct sha256_state outer;
    sha256_state_init(&outer);
    for (int i = 0; i < 64; i++) pad[i] ^= 0x36 ^ 0x5c;
    sha256_state_update(&outer, pad, 64);
    for (int i = 0; i < 8; i++) state->outerH[i] = outer.H[i];

    hashes_zero((uint8_t *)&outer, sizeof(outer));
    hashes_zero(pad, sizeof(pad));
}

__attribute__((noinline))
static void hmac_sha256_state_update(struct hmac_sha256_state *state,
                                     const uint8_t *in, uint32_t len) {
    sha256_state_update(&state->inner, in, len);
}

__attribute__((noinline))
static void hmac_sha256_state_finalize(struct hmac_sha256_state *state,
                                       uint8_t *out) {
    uint8_t intermediate[32];
    sha256_state_finalize(&state->inner, intermediate);

    struct sha256_state outer;
    sha256_state_init(&outer);
    outer.length = 64;
    for (int i = 0; i < 8; i++) outer.H[i] = state->outerH[i];
    sha256_state_update(&outer, intermediate, sizeof(intermediate));
    sha256_state_finalize(&outer, state->inner.block);

    hashes_zero((uint8_t *)&outer, sizeof(outer));
    hashes_zero(intermediate, sizeof(intermediate));
    for (int i = 0; i < 32; i++) out[i] = state->inner.block[i];
}

__attribute__((export_name("hmac_sha256_init")))
void ox_hmac_sha256_init(struct hmac_sha256_state *state, const uint8_t *key,
                         uint32_t keyLen) {
    hmac_sha256_state_init(state, key, keyLen);
}

__attribute__((export_name("hmac_sha256_update")))
void ox_hmac_sha256_update(struct hmac_sha256_state *state, const uint8_t *in,
                           uint32_t len) {
    hmac_sha256_state_update(state, in, len);
}

__attribute__((export_name("hmac_sha256_finalize")))
void ox_hmac_sha256_finalize(struct hmac_sha256_state *state, uint8_t *out) {
    hmac_sha256_state_finalize(state, out);
}

__attribute__((export_name("hmac_sha256")))
void ox_hmac_sha256(const uint8_t *key, uint32_t keyLen, const uint8_t *msg,
                    uint32_t msgLen, uint8_t *out,
                    struct hmac_sha256_state *scratch) {
    hmac_sha256_state_init(scratch, key, keyLen);
    hmac_sha256_state_update(scratch, msg, msgLen);
    hmac_sha256_state_finalize(scratch, out);
    hashes_zero((uint8_t *)scratch, sizeof(*scratch));
}

// PBKDF2-HMAC-SHA256 — RFC 8018.

struct pbkdf2_sha256_scratch {
    struct hmac_sha256_state base;
    struct hmac_sha256_state working;
    uint8_t u[32];
    uint8_t t[32];
};

_Static_assert(
    sizeof(struct pbkdf2_sha256_scratch) == PBKDF2_SHA256_SCRATCH_SIZE,
    "PBKDF2-HMAC-SHA256 scratch size must match the loader");

__attribute__((export_name("pbkdf2_sha256")))
void ox_pbkdf2_sha256(const uint8_t *password, uint32_t passwordLen,
                      uint8_t *salt, uint32_t saltLen, uint32_t iterations,
                      uint8_t *out, uint32_t outLen,
                      struct pbkdf2_sha256_scratch *scratch) {
    uint32_t offset = 0;
    uint32_t blockIndex = 1;
    hmac_sha256_state_init(&scratch->base, password, passwordLen);

    while (offset < outLen) {
        store32_be(salt + saltLen, blockIndex);
        scratch->working = scratch->base;
        hmac_sha256_state_update(&scratch->working, salt, saltLen + 4);
        hmac_sha256_state_finalize(&scratch->working, scratch->u);
        for (int i = 0; i < 32; i++) scratch->t[i] = scratch->u[i];

        for (uint32_t iteration = 1; iteration < iterations; iteration++) {
            scratch->working = scratch->base;
            hmac_sha256_state_update(
                &scratch->working, scratch->u, sizeof(scratch->u));
            hmac_sha256_state_finalize(&scratch->working, scratch->u);
            for (int i = 0; i < 32; i++) scratch->t[i] ^= scratch->u[i];
        }

        const uint32_t remaining = outLen - offset;
        const uint32_t take = remaining < 32 ? remaining : 32;
        for (uint32_t i = 0; i < take; i++)
            out[offset + i] = scratch->t[i];
        offset += take;
        blockIndex++;
    }

    hashes_zero((uint8_t *)scratch, sizeof(*scratch));
}

// RIPEMD-160 — Dobbertin/Bosselaers/Preneel.

#define ROTL32(x, n) (((x) << (n)) | ((x) >> (32 - (n))))

static const uint8_t RMD_RL[80] = {
     0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
     7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
     3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
     1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
     4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13,
};
static const uint8_t RMD_RR[80] = {
     5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
     6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
     8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11,
};
static const uint8_t RMD_SL[80] = {
    11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
     7,  6,  8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
    11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
     9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6,
};
static const uint8_t RMD_SR[80] = {
     8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
     9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
     9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
     8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11,
};
static const uint32_t RMD_KL[5] = {
    0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e,
};
static const uint32_t RMD_KR[5] = {
    0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000,
};

static uint32_t rmd_f(int round, uint32_t x, uint32_t y, uint32_t z) {
    if (round == 0) return x ^ y ^ z;
    if (round == 1) return (x & y) | (~x & z);
    if (round == 2) return (x | ~y) ^ z;
    if (round == 3) return (x & z) | (y & ~z);
    return x ^ (y | ~z);
}

__attribute__((noinline))
static void ripemd160_compress(uint32_t *H, const uint8_t *block) {
    uint32_t X[16];
    for (int i = 0; i < 16; i++) X[i] = load32_le(block + i * 4);

    uint32_t al = H[0], bl = H[1], cl = H[2], dl = H[3], el = H[4];
    uint32_t ar = H[0], br = H[1], cr = H[2], dr = H[3], er = H[4];

    for (int i = 0; i < 80; i++) {
        const int round = i / 16;
        uint32_t t = al + rmd_f(round, bl, cl, dl) + X[RMD_RL[i]] + RMD_KL[round];
        t = ROTL32(t, RMD_SL[i]) + el;
        al = el; el = dl; dl = ROTL32(cl, 10); cl = bl; bl = t;

        t = ar + rmd_f(4 - round, br, cr, dr) + X[RMD_RR[i]] + RMD_KR[round];
        t = ROTL32(t, RMD_SR[i]) + er;
        ar = er; er = dr; dr = ROTL32(cr, 10); cr = br; br = t;
    }

    const uint32_t t = H[1] + cl + dr;
    H[1] = H[2] + dl + er;
    H[2] = H[3] + el + ar;
    H[3] = H[4] + al + br;
    H[4] = H[0] + bl + cr;
    H[0] = t;
}

struct ripemd160_state {
    uint64_t length;
    uint32_t H[5];
    uint32_t buffered;
    uint8_t block[64];
};

_Static_assert(
    sizeof(struct ripemd160_state) == RIPEMD160_STATE_SIZE,
    "RIPEMD-160 state size must match the loader");

__attribute__((noinline, export_name("ripemd160_init")))
void ox_ripemd160_init(struct ripemd160_state *state) {
    state->length = 0;
    state->H[0] = 0x67452301;
    state->H[1] = 0xefcdab89;
    state->H[2] = 0x98badcfe;
    state->H[3] = 0x10325476;
    state->H[4] = 0xc3d2e1f0;
    state->buffered = 0;
    for (int i = 0; i < 64; i++) state->block[i] = 0;
}

__attribute__((noinline, export_name("ripemd160_update")))
void ox_ripemd160_update(struct ripemd160_state *state, const uint8_t *in,
                         uint32_t len) {
    uint32_t offset = 0;
    state->length += len;

    if (state->buffered) {
        const uint32_t available = 64 - state->buffered;
        const uint32_t take = len < available ? len : available;
        for (uint32_t i = 0; i < take; i++)
            state->block[state->buffered + i] = in[i];
        state->buffered += take;
        offset += take;

        if (state->buffered == 64) {
            ripemd160_compress(state->H, state->block);
            state->buffered = 0;
        }
        if (offset == len) return;
    }

    while (len - offset >= 64) {
        ripemd160_compress(state->H, in + offset);
        offset += 64;
    }

    const uint32_t remaining = len - offset;
    for (uint32_t i = 0; i < remaining; i++)
        state->block[i] = in[offset + i];
    state->buffered = remaining;
}

__attribute__((noinline, export_name("ripemd160_finalize")))
void ox_ripemd160_finalize(struct ripemd160_state *state, uint8_t *out) {
    uint8_t block[128];
    const uint32_t total = state->buffered >= 56 ? 128 : 64;

    for (uint32_t i = 0; i < total; i++) block[i] = 0;
    for (uint32_t i = 0; i < state->buffered; i++)
        block[i] = state->block[i];
    block[state->buffered] = 0x80;

    const uint64_t bits = state->length * 8;
    for (int i = 0; i < 8; i++)
        block[total - 8 + i] = (uint8_t)(bits >> (i * 8));

    ripemd160_compress(state->H, block);
    if (total == 128) ripemd160_compress(state->H, block + 64);
    for (int i = 0; i < 5; i++) {
        out[i * 4 + 0] = (uint8_t)state->H[i];
        out[i * 4 + 1] = (uint8_t)(state->H[i] >> 8);
        out[i * 4 + 2] = (uint8_t)(state->H[i] >> 16);
        out[i * 4 + 3] = (uint8_t)(state->H[i] >> 24);
    }
    hashes_zero(block, sizeof(block));
}

__attribute__((export_name("ripemd160")))
void ox_ripemd160(const uint8_t *in, uint32_t len, uint8_t *out) {
    struct ripemd160_state state;
    ox_ripemd160_init(&state);
    ox_ripemd160_update(&state, in, len);
    ox_ripemd160_finalize(&state, out);
}
