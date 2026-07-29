// Scrypt for the `Keystore` engine slot.
//
// JS allocates every variable-sized region explicitly and passes its pointer:
//   B       128 * r * p bytes, plus four bytes for PBKDF2's block counter
//   V       128 * r * N bytes
//   tmp     128 * r bytes
//   scratch fixed SHA-256, HMAC, and Salsa20/8 working state
//
// The target has no allocator state. The loader validates all products, grows
// memory once, serializes use of the instance, and clears the whole region.

#include "ox_rt.h"

#define ROTR32(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define ROTL32(x, n) (((x) << (n)) | ((x) >> (32 - (n))))

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

static void store32_be(uint8_t *p, uint32_t value) {
    p[0] = (uint8_t)(value >> 24);
    p[1] = (uint8_t)(value >> 16);
    p[2] = (uint8_t)(value >> 8);
    p[3] = (uint8_t)value;
}

struct hmac_sha256_scratch {
    uint8_t pad[64];
    uint32_t H[8];
    uint8_t block[128];
    uint32_t W[64];
    uint32_t innerH[8];
    uint32_t outerH[8];
};

struct scrypt_scratch {
    struct hmac_sha256_scratch hmac;
    uint32_t salsaX[16];
    uint32_t salsaY[16];
};

_Static_assert(
    sizeof(struct scrypt_scratch) == SCRYPT_SCRATCH_SIZE,
    "scrypt scratch size must match the loader");

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

static void sha256_init(uint32_t *H) {
    H[0] = 0x6a09e667; H[1] = 0xbb67ae85;
    H[2] = 0x3c6ef372; H[3] = 0xa54ff53a;
    H[4] = 0x510e527f; H[5] = 0x9b05688c;
    H[6] = 0x1f83d9ab; H[7] = 0x5be0cd19;
}

static void sha256_finish_with_scratch(const uint8_t *input, uint32_t length,
                                       uint64_t prefixLength, uint8_t *out,
                                       uint32_t *H, uint8_t *block,
                                       uint32_t *W) {
    uint32_t offset = 0;
    while (length - offset >= 64) {
        sha256_compress(H, input + offset, W);
        offset += 64;
    }

    const uint32_t remaining = length - offset;
    const uint32_t total = remaining >= 56 ? 128 : 64;
    for (uint32_t i = 0; i < total; i++) block[i] = 0;
    for (uint32_t i = 0; i < remaining; i++) block[i] = input[offset + i];
    block[remaining] = 0x80;

    const uint64_t bits = (prefixLength + length) * 8;
    for (int i = 0; i < 8; i++)
        block[total - 1 - i] = (uint8_t)(bits >> (i * 8));

    sha256_compress(H, block, W);
    if (total == 128) sha256_compress(H, block + 64, W);
    for (int i = 0; i < 8; i++) store32_be(out + i * 4, H[i]);
}

static void sha256_hash_with_scratch(const uint8_t *input, uint32_t length,
                                     uint8_t *out, uint32_t *H,
                                     uint8_t *block, uint32_t *W) {
    sha256_init(H);
    sha256_finish_with_scratch(input, length, 0, out, H, block, W);
}

static void hmac_sha256_init(const uint8_t *key, uint32_t keyLength,
                             struct hmac_sha256_scratch *scratch) {
    uint8_t *pad = scratch->pad;
    uint32_t *H = scratch->H;
    uint8_t *block = scratch->block;
    uint32_t *W = scratch->W;

    for (int i = 0; i < 64; i++) pad[i] = 0;
    if (keyLength > 64)
        sha256_hash_with_scratch(key, keyLength, pad, H, block, W);
    else
        for (uint32_t i = 0; i < keyLength; i++) pad[i] = key[i];

    sha256_init(scratch->innerH);
    for (int i = 0; i < 64; i++) block[i] = pad[i] ^ 0x36;
    sha256_compress(scratch->innerH, block, W);

    sha256_init(scratch->outerH);
    for (int i = 0; i < 64; i++) block[i] = pad[i] ^ 0x5c;
    sha256_compress(scratch->outerH, block, W);
}

static void hmac_sha256_from_states(const uint8_t *message,
                                    uint32_t messageLength,
                                    uint8_t *intermediate, uint8_t *out,
                                    struct hmac_sha256_scratch *scratch) {
    for (int i = 0; i < 8; i++) scratch->H[i] = scratch->innerH[i];
    sha256_finish_with_scratch(message, messageLength, 64, intermediate,
                               scratch->H, scratch->block, scratch->W);

    for (int i = 0; i < 8; i++) scratch->H[i] = scratch->outerH[i];
    sha256_finish_with_scratch(intermediate, 32, 64, out, scratch->H,
                               scratch->block, scratch->W);
}

static void pbkdf2_sha256(const uint8_t *password, uint32_t passwordLength,
                          uint8_t *salt, uint32_t saltLength, uint8_t *out,
                          uint32_t outLength,
                          struct hmac_sha256_scratch *scratch) {
    uint32_t offset = 0;
    uint32_t blockIndex = 1;
    uint8_t *u = scratch->pad;
    uint8_t *t = u + 32;

    hmac_sha256_init(password, passwordLength, scratch);
    while (offset < outLength) {
        store32_be(salt + saltLength, blockIndex);
        hmac_sha256_from_states(salt, saltLength + 4, u, u, scratch);
        for (int i = 0; i < 32; i++) t[i] = u[i];

        const uint32_t remaining = outLength - offset;
        const uint32_t take = remaining < 32 ? remaining : 32;
        for (uint32_t i = 0; i < take; i++) out[offset + i] = t[i];
        offset += take;
        blockIndex++;
    }
}

static void salsa20_8(uint32_t *out, const uint32_t *left,
                      const uint32_t *right,
                      struct scrypt_scratch *scratch) {
    uint32_t *x = scratch->salsaX;
    uint32_t *y = scratch->salsaY;
    for (int i = 0; i < 16; i++) x[i] = y[i] = left[i] ^ right[i];

    for (int i = 0; i < 8; i += 2) {
        x[4] ^= ROTL32(x[0] + x[12], 7);
        x[8] ^= ROTL32(x[4] + x[0], 9);
        x[12] ^= ROTL32(x[8] + x[4], 13);
        x[0] ^= ROTL32(x[12] + x[8], 18);
        x[9] ^= ROTL32(x[5] + x[1], 7);
        x[13] ^= ROTL32(x[9] + x[5], 9);
        x[1] ^= ROTL32(x[13] + x[9], 13);
        x[5] ^= ROTL32(x[1] + x[13], 18);
        x[14] ^= ROTL32(x[10] + x[6], 7);
        x[2] ^= ROTL32(x[14] + x[10], 9);
        x[6] ^= ROTL32(x[2] + x[14], 13);
        x[10] ^= ROTL32(x[6] + x[2], 18);
        x[3] ^= ROTL32(x[15] + x[11], 7);
        x[7] ^= ROTL32(x[3] + x[15], 9);
        x[11] ^= ROTL32(x[7] + x[3], 13);
        x[15] ^= ROTL32(x[11] + x[7], 18);
        x[1] ^= ROTL32(x[0] + x[3], 7);
        x[2] ^= ROTL32(x[1] + x[0], 9);
        x[3] ^= ROTL32(x[2] + x[1], 13);
        x[0] ^= ROTL32(x[3] + x[2], 18);
        x[6] ^= ROTL32(x[5] + x[4], 7);
        x[7] ^= ROTL32(x[6] + x[5], 9);
        x[4] ^= ROTL32(x[7] + x[6], 13);
        x[5] ^= ROTL32(x[4] + x[7], 18);
        x[11] ^= ROTL32(x[10] + x[9], 7);
        x[8] ^= ROTL32(x[11] + x[10], 9);
        x[9] ^= ROTL32(x[8] + x[11], 13);
        x[10] ^= ROTL32(x[9] + x[8], 18);
        x[12] ^= ROTL32(x[15] + x[14], 7);
        x[13] ^= ROTL32(x[12] + x[15], 9);
        x[14] ^= ROTL32(x[13] + x[12], 13);
        x[15] ^= ROTL32(x[14] + x[13], 18);
    }

    for (int i = 0; i < 16; i++) out[i] = x[i] + y[i];
}

static void block_mix(const uint32_t *input, uint32_t *out, uint32_t r,
                      struct scrypt_scratch *scratch) {
    const uint32_t *previous = input + (2 * r - 1) * 16;
    uint32_t *even = out;
    uint32_t *odd = out + r * 16;

    for (uint32_t i = 0; i < r; i++) {
        salsa20_8(even, previous, input + i * 32, scratch);
        previous = even;
        salsa20_8(odd, previous, input + i * 32 + 16, scratch);
        previous = odd;
        even += 16;
        odd += 16;
    }
}

__attribute__((export_name("scrypt")))
void ox_scrypt(const uint8_t *password, uint32_t passwordLength,
               uint8_t *salt, uint32_t saltLength, uint32_t N, uint32_t r,
               uint32_t p, uint8_t *out, uint32_t outLength, uint8_t *BBytes,
               uint32_t *V, uint32_t *tmp,
               struct scrypt_scratch *scratch) {
    const uint32_t blockWords = 32 * r;
    const uint32_t blockBytes = 128 * r;
    uint32_t *B = (uint32_t *)BBytes;

    pbkdf2_sha256(password, passwordLength, salt, saltLength, BBytes,
                  blockBytes * p, &scratch->hmac);

    for (uint32_t parallel = 0; parallel < p; parallel++) {
        uint32_t *block = B + parallel * blockWords;
        for (uint32_t i = 0; i < blockWords; i++) V[i] = block[i];
        for (uint32_t i = 1; i < N; i++)
            block_mix(V + (i - 1) * blockWords, V + i * blockWords, r, scratch);
        block_mix(V + (N - 1) * blockWords, block, r, scratch);

        for (uint32_t i = 0; i < N; i++) {
            const uint32_t index = block[blockWords - 16] & (N - 1);
            const uint32_t *selected = V + index * blockWords;
            for (uint32_t j = 0; j < blockWords; j++)
                tmp[j] = block[j] ^ selected[j];
            block_mix(tmp, block, r, scratch);
        }
    }

    pbkdf2_sha256(password, passwordLength, BBytes, blockBytes * p, out,
                  outLength, &scratch->hmac);
}
