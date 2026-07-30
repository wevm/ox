#define _POSIX_C_SOURCE 200809L

#include <float.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define CHECK(condition) do {                                              \
    if (!(condition)) {                                                    \
        fprintf(stderr, "native C benchmark check failed: %s\n",          \
                #condition);                                               \
        abort();                                                           \
    }                                                                      \
} while (0)

typedef void (*operation)(void *);

void blake3_finalize(const void *, uint8_t *);
void blake3_hash(const uint8_t *, uint32_t, uint8_t *);
void blake3_init(void *);
void blake3_update(void *, const uint8_t *, uint32_t);
void ox_ed25519_get_public_key(uint8_t *, uint8_t *);
void ox_ed25519_sign(uint8_t *, const uint8_t *, uint32_t, uint8_t *);
void ox_ed25519_to_montgomery_secret(const uint8_t *, uint8_t *);
int ox_ed25519_verify(
    const uint8_t *, const uint8_t *, uint32_t, const uint8_t *);
void ox_hmac_sha256(
    const uint8_t *,
    uint32_t,
    const uint8_t *,
    uint32_t,
    uint8_t *,
    void *
);
void ox_hmac_sha256_finalize(void *, uint8_t *);
void ox_hmac_sha256_init(void *, const uint8_t *, uint32_t);
void ox_hmac_sha256_update(void *, const uint8_t *, uint32_t);
void ox_keccak256(const uint8_t *, uint32_t, uint8_t *);
void ox_keccak256_finalize(void *, uint8_t *);
void ox_keccak256_init(void *);
void ox_keccak256_update(void *, const uint8_t *, uint32_t);
void ox_mnemonic_to_seed(
    const uint8_t *, uint32_t, const uint8_t *, uint32_t, uint8_t *);
void ox_pbkdf2_sha256(
    const uint8_t *,
    uint32_t,
    uint8_t *,
    uint32_t,
    uint32_t,
    uint8_t *,
    uint32_t,
    void *
);
void ox_ripemd160(const uint8_t *, uint32_t, uint8_t *);
void ox_ripemd160_finalize(void *, uint8_t *);
void ox_ripemd160_init(void *);
void ox_ripemd160_update(void *, const uint8_t *, uint32_t);
void ox_scrypt(
    const uint8_t *,
    uint32_t,
    uint8_t *,
    uint32_t,
    uint32_t,
    uint32_t,
    uint32_t,
    uint8_t *,
    uint32_t,
    uint8_t *,
    uint32_t *,
    uint32_t *,
    void *
);
int ox_secp256k1_get_public_key(const uint8_t *, uint8_t *);
int ox_secp256k1_get_shared_secret(
    const uint8_t *, const uint8_t *, uint32_t, uint8_t *);
int ox_secp256k1_init(void);
int ox_secp256k1_recover_public_key(
    const uint8_t *, const uint8_t *, uint32_t, uint8_t *);
int ox_secp256k1_sign(
    const uint8_t *,
    uint32_t,
    const uint8_t *,
    const uint8_t *,
    uint32_t,
    int,
    uint8_t *
);
int ox_secp256k1_verify(
    const uint8_t *,
    const uint8_t *,
    uint32_t,
    const uint8_t *,
    uint32_t,
    int
);
void ox_sha256(const uint8_t *, uint32_t, uint8_t *);
void ox_sha256_finalize(void *, uint8_t *);
void ox_sha256_init(void *);
void ox_sha256_update(void *, const uint8_t *, uint32_t);
void ox_zero(uint8_t *, uint32_t);
void ox_x25519_get_public_key(const uint8_t *, uint8_t *);
int ox_x25519_get_shared_secret(
    const uint8_t *, const uint8_t *, uint8_t *);

static double now_ms(void) {
    struct timespec time;
    CHECK(clock_gettime(CLOCK_MONOTONIC, &time) == 0);
    return (double)time.tv_sec * 1000.0 + (double)time.tv_nsec / 1000000.0;
}

static double duration(const char *name, double fallback, int allow_zero) {
    const char *value = getenv(name);
    if (value == NULL) return fallback;
    char *end;
    const double parsed = strtod(value, &end);
    CHECK(end != value && *end == '\0' && isfinite(parsed));
    CHECK(allow_zero ? parsed >= 0.0 : parsed > 0.0);
    return parsed;
}

static unsigned int repeats(void) {
    const char *value = getenv("OX_BENCH_REPEATS");
    if (value == NULL) return 3;
    char *end;
    const unsigned long parsed = strtoul(value, &end, 10);
    CHECK(end != value && *end == '\0' && parsed > 0 && parsed <= UINT32_MAX);
    return (unsigned int)parsed;
}

static double measure(
    operation run,
    void *context,
    uint64_t batch,
    double warmup_ms,
    double budget_ms,
    unsigned int repeat_count
) {
    double best = DBL_MAX;
    for (unsigned int repeat = 0; repeat < repeat_count; repeat++) {
        double start = now_ms();
        while (now_ms() - start < warmup_ms) run(context);

        uint64_t iterations = 0;
        start = now_ms();
        while (now_ms() - start < budget_ms) {
            for (uint64_t i = 0; i < batch; i++) run(context);
            iterations += batch;
        }
        const double elapsed = now_ms() - start;
        const double ns = elapsed * 1000000.0 / (double)iterations;
        if (ns < best) best = ns;
    }
    return best;
}

static void row_batch(
    const char *primitive,
    size_t size,
    operation run,
    void *context,
    uint64_t batch,
    double warmup_ms,
    double budget_ms,
    unsigned int repeat_count
) {
    const double ns = measure(
        run, context, batch, warmup_ms, budget_ms, repeat_count);
    printf("%s,%zu,%.2f\n", primitive, size, ns);
}

static void row(
    const char *primitive,
    size_t size,
    operation run,
    void *context,
    double warmup_ms,
    double budget_ms,
    unsigned int repeat_count
) {
    row_batch(
        primitive,
        size,
        run,
        context,
        32,
        warmup_ms,
        budget_ms,
        repeat_count
    );
}

static void fill(uint8_t *output, size_t size, size_t modulus) {
    for (size_t i = 0; i < size; i++) output[i] = (uint8_t)(i % modulus);
}

union hash_scratch {
    uint32_t align;
    uint8_t bytes[544];
};

union hash_state {
    uint64_t align;
    uint8_t bytes[BLAKE3_STATE_SIZE];
};

struct hash_context {
    const uint8_t *input;
    uint32_t input_size;
    uint8_t key[32];
    uint8_t output[32];
    union hash_scratch scratch;
    union hash_state state;
};

static void run_blake3(void *opaque) {
    struct hash_context *context = opaque;
    blake3_hash(
        context->input, context->input_size, context->output);
}

static void run_hmac_sha256(void *opaque) {
    struct hash_context *context = opaque;
    ox_hmac_sha256(
        context->key,
        sizeof(context->key),
        context->input,
        context->input_size,
        context->output,
        context->scratch.bytes
    );
}

static void run_keccak256(void *opaque) {
    struct hash_context *context = opaque;
    ox_keccak256(
        context->input, context->input_size, context->output);
}

static void run_ripemd160(void *opaque) {
    struct hash_context *context = opaque;
    ox_ripemd160(
        context->input, context->input_size, context->output);
}

static void run_sha256(void *opaque) {
    struct hash_context *context = opaque;
    ox_sha256(
        context->input, context->input_size, context->output);
}

#define HASH_STREAM_CHUNK_SIZE 65536

static uint32_t hash_stream_chunk_size(
    const struct hash_context *context,
    uint32_t offset
) {
    const uint32_t remaining = context->input_size - offset;
    return remaining < HASH_STREAM_CHUNK_SIZE
        ? remaining
        : HASH_STREAM_CHUNK_SIZE;
}

static void run_blake3_stream(void *opaque) {
    struct hash_context *context = opaque;
    blake3_init(context->state.bytes);
    for (uint32_t offset = 0; offset < context->input_size;
         offset += HASH_STREAM_CHUNK_SIZE)
        blake3_update(
            context->state.bytes,
            context->input + offset,
            hash_stream_chunk_size(context, offset)
        );
    blake3_finalize(context->state.bytes, context->output);
    ox_zero(context->state.bytes, BLAKE3_STATE_SIZE);
}

static void run_hmac_sha256_stream(void *opaque) {
    struct hash_context *context = opaque;
    ox_hmac_sha256_init(
        context->state.bytes, context->key, sizeof(context->key));
    for (uint32_t offset = 0; offset < context->input_size;
         offset += HASH_STREAM_CHUNK_SIZE)
        ox_hmac_sha256_update(
            context->state.bytes,
            context->input + offset,
            hash_stream_chunk_size(context, offset)
        );
    ox_hmac_sha256_finalize(context->state.bytes, context->output);
    ox_zero(context->state.bytes, HMAC_SHA256_STATE_SIZE);
}

static void run_keccak256_stream(void *opaque) {
    struct hash_context *context = opaque;
    ox_keccak256_init(context->state.bytes);
    for (uint32_t offset = 0; offset < context->input_size;
         offset += HASH_STREAM_CHUNK_SIZE)
        ox_keccak256_update(
            context->state.bytes,
            context->input + offset,
            hash_stream_chunk_size(context, offset)
        );
    ox_keccak256_finalize(context->state.bytes, context->output);
    ox_zero(context->state.bytes, KECCAK256_STATE_SIZE);
}

static void run_ripemd160_stream(void *opaque) {
    struct hash_context *context = opaque;
    ox_ripemd160_init(context->state.bytes);
    for (uint32_t offset = 0; offset < context->input_size;
         offset += HASH_STREAM_CHUNK_SIZE)
        ox_ripemd160_update(
            context->state.bytes,
            context->input + offset,
            hash_stream_chunk_size(context, offset)
        );
    ox_ripemd160_finalize(context->state.bytes, context->output);
    ox_zero(context->state.bytes, RIPEMD160_STATE_SIZE);
}

static void run_sha256_stream(void *opaque) {
    struct hash_context *context = opaque;
    ox_sha256_init(context->state.bytes);
    for (uint32_t offset = 0; offset < context->input_size;
         offset += HASH_STREAM_CHUNK_SIZE)
        ox_sha256_update(
            context->state.bytes,
            context->input + offset,
            hash_stream_chunk_size(context, offset)
        );
    ox_sha256_finalize(context->state.bytes, context->output);
    ox_zero(context->state.bytes, SHA256_STATE_SIZE);
}

struct ed25519_context {
    uint8_t private_key[32];
    uint8_t public_key[32];
    uint8_t payload[32];
    uint8_t signature[64];
    uint8_t output[64];
    int valid;
};

static void run_ed25519_get_public_key(void *opaque) {
    struct ed25519_context *context = opaque;
    uint8_t seed[32];
    memcpy(seed, context->private_key, sizeof(seed));
    ox_ed25519_get_public_key(seed, context->output);
}

static void run_ed25519_sign(void *opaque) {
    struct ed25519_context *context = opaque;
    uint8_t seed[32];
    memcpy(seed, context->private_key, sizeof(seed));
    ox_ed25519_sign(
        seed, context->payload, sizeof(context->payload), context->output);
}

static void run_ed25519_to_montgomery_secret(void *opaque) {
    struct ed25519_context *context = opaque;
    ox_ed25519_to_montgomery_secret(
        context->private_key, context->output);
}

static void run_ed25519_verify(void *opaque) {
    struct ed25519_context *context = opaque;
    context->valid = ox_ed25519_verify(
        context->signature,
        context->payload,
        sizeof(context->payload),
        context->public_key
    );
}

struct pbkdf2_context {
    uint8_t password[16];
    uint8_t salt[36];
    uint8_t output[32];
    union hash_scratch scratch;
};

static void run_pbkdf2_sha256(void *opaque) {
    struct pbkdf2_context *context = opaque;
    ox_pbkdf2_sha256(
        context->password,
        sizeof(context->password),
        context->salt,
        32,
        262144,
        context->output,
        sizeof(context->output),
        context->scratch.bytes
    );
}

union scrypt_scratch {
    uint32_t align;
    uint8_t bytes[SCRYPT_SCRATCH_SIZE];
};

struct scrypt_context {
    uint8_t password[16];
    uint32_t password_size;
    uint8_t salt[36];
    uint32_t salt_size;
    uint32_t N;
    uint32_t r;
    uint32_t p;
    uint8_t output[64];
    uint32_t output_size;
    uint8_t *B;
    uint32_t *V;
    uint32_t *tmp;
    union scrypt_scratch scratch;
};

static void init_scrypt(
    struct scrypt_context *context,
    uint32_t N,
    uint32_t r,
    uint32_t p,
    uint32_t output_size
) {
    memset(context, 0, sizeof(*context));
    const size_t block_size = 128 * r;
    context->N = N;
    context->r = r;
    context->p = p;
    context->output_size = output_size;
    context->B = malloc(block_size * p);
    context->V = malloc(block_size * N);
    context->tmp = malloc(block_size);
    CHECK(context->B != NULL && context->V != NULL && context->tmp != NULL);
}

static void destroy_scrypt(struct scrypt_context *context) {
    free(context->B);
    free(context->V);
    free(context->tmp);
}

static void run_scrypt(void *opaque) {
    struct scrypt_context *context = opaque;
    ox_scrypt(
        context->password,
        context->password_size,
        context->salt,
        context->salt_size,
        context->N,
        context->r,
        context->p,
        context->output,
        context->output_size,
        context->B,
        context->V,
        context->tmp,
        context->scratch.bytes
    );
}

struct mnemonic_context {
    const uint8_t *phrase;
    uint32_t phrase_size;
    uint8_t output[64];
};

static void run_mnemonic_to_seed(void *opaque) {
    static const uint8_t salt[] = "mnemonic";
    struct mnemonic_context *context = opaque;
    ox_mnemonic_to_seed(
        context->phrase,
        context->phrase_size,
        salt,
        sizeof(salt) - 1,
        context->output
    );
}

struct x25519_context {
    uint8_t private_key[32];
    uint8_t private_key_b[32];
    uint8_t public_key[32];
    uint8_t public_key_b[32];
    uint8_t output[32];
};

static void run_x25519_get_public_key(void *opaque) {
    struct x25519_context *context = opaque;
    ox_x25519_get_public_key(context->private_key, context->output);
}

static void run_x25519_get_shared_secret(void *opaque) {
    struct x25519_context *context = opaque;
    CHECK(ox_x25519_get_shared_secret(
        context->private_key, context->public_key_b, context->output));
}

struct secp256k1_context {
    uint8_t private_key[32];
    uint8_t private_key_b[32];
    uint8_t public_key[65];
    uint8_t public_key_b[65];
    uint8_t payload[32];
    uint8_t signature[65];
    uint8_t compact_signature[64];
    uint8_t output[65];
    int valid;
};

static void run_secp256k1_get_public_key(void *opaque) {
    struct secp256k1_context *context = opaque;
    CHECK(ox_secp256k1_get_public_key(
        context->private_key, context->output));
}

static void run_secp256k1_get_shared_secret(void *opaque) {
    struct secp256k1_context *context = opaque;
    CHECK(ox_secp256k1_get_shared_secret(
        context->private_key,
        context->public_key_b,
        sizeof(context->public_key_b),
        context->output
    ));
}

static void run_secp256k1_recover_public_key(void *opaque) {
    struct secp256k1_context *context = opaque;
    CHECK(ox_secp256k1_recover_public_key(
        context->signature,
        context->payload,
        sizeof(context->payload),
        context->output
    ));
}

static void run_secp256k1_sign(void *opaque) {
    struct secp256k1_context *context = opaque;
    CHECK(ox_secp256k1_sign(
        context->payload,
        sizeof(context->payload),
        context->private_key,
        NULL,
        0,
        0,
        context->output
    ));
}

static void run_secp256k1_verify(void *opaque) {
    struct secp256k1_context *context = opaque;
    context->valid = ox_secp256k1_verify(
        context->compact_signature,
        context->payload,
        sizeof(context->payload),
        context->public_key,
        sizeof(context->public_key),
        0
    );
}

int main(void) {
    static const size_t hash_sizes[] = {
        32, 64, 256, 1024, 4096, 65536, 1048576,
    };
    const double warmup_ms = duration("OX_BENCH_WARMUP_MS", 200.0, 1);
    const double budget_ms = duration("OX_BENCH_BUDGET_MS", 900.0, 0);
    const unsigned int repeat_count = repeats();

    printf("primitive,size,ns_per_op\n");

    struct hash_context hash = {0};
    fill(hash.key, sizeof(hash.key), 97);
    for (size_t i = 0; i < sizeof(hash_sizes) / sizeof(hash_sizes[0]); i++) {
        const size_t size = hash_sizes[i];
        uint8_t *input = malloc(size);
        CHECK(input != NULL);
        fill(input, size, 251);
        hash.input = input;
        hash.input_size = (uint32_t)size;

        row("hash.blake3", size, run_blake3, &hash,
            warmup_ms, budget_ms, repeat_count);
        row("hash.hmacSha256", size, run_hmac_sha256, &hash,
            warmup_ms, budget_ms, repeat_count);
        row("hash.keccak256", size, run_keccak256, &hash,
            warmup_ms, budget_ms, repeat_count);
        row("hash.ripemd160", size, run_ripemd160, &hash,
            warmup_ms, budget_ms, repeat_count);
        row("hash.sha256", size, run_sha256, &hash,
            warmup_ms, budget_ms, repeat_count);

        if (size == 1048576) {
            uint8_t expected[32];

            blake3_hash(input, (uint32_t)size, expected);
            run_blake3_stream(&hash);
            CHECK(memcmp(hash.output, expected, 32) == 0);

            ox_hmac_sha256(
                hash.key,
                sizeof(hash.key),
                input,
                (uint32_t)size,
                expected,
                hash.scratch.bytes
            );
            run_hmac_sha256_stream(&hash);
            CHECK(memcmp(hash.output, expected, 32) == 0);

            ox_keccak256(input, (uint32_t)size, expected);
            run_keccak256_stream(&hash);
            CHECK(memcmp(hash.output, expected, 32) == 0);

            ox_ripemd160(input, (uint32_t)size, expected);
            run_ripemd160_stream(&hash);
            CHECK(memcmp(hash.output, expected, 20) == 0);

            ox_sha256(input, (uint32_t)size, expected);
            run_sha256_stream(&hash);
            CHECK(memcmp(hash.output, expected, 32) == 0);

            row_batch("hash.blake3_stream", size, run_blake3_stream, &hash,
                1, warmup_ms, budget_ms, repeat_count);
            row_batch(
                "hash.hmac_sha256_stream",
                size,
                run_hmac_sha256_stream,
                &hash,
                1,
                warmup_ms,
                budget_ms,
                repeat_count
            );
            row_batch("hash.keccak256_stream", size, run_keccak256_stream,
                &hash, 1, warmup_ms, budget_ms, repeat_count);
            row_batch("hash.ripemd160_stream", size, run_ripemd160_stream,
                &hash, 1, warmup_ms, budget_ms, repeat_count);
            row_batch("hash.sha256_stream", size, run_sha256_stream, &hash,
                1, warmup_ms, budget_ms, repeat_count);
        }
        free(input);
    }

    struct ed25519_context ed25519 = {0};
    fill(ed25519.private_key, sizeof(ed25519.private_key), 97);
    fill(ed25519.payload, sizeof(ed25519.payload), 251);
    run_ed25519_get_public_key(&ed25519);
    memcpy(ed25519.public_key, ed25519.output, sizeof(ed25519.public_key));
    run_ed25519_sign(&ed25519);
    memcpy(ed25519.signature, ed25519.output, sizeof(ed25519.signature));
    run_ed25519_verify(&ed25519);
    CHECK(ed25519.valid);

    row("ed25519.getPublicKey", 32, run_ed25519_get_public_key, &ed25519,
        warmup_ms, budget_ms, repeat_count);
    row("ed25519.sign", 32, run_ed25519_sign, &ed25519,
        warmup_ms, budget_ms, repeat_count);
    row("ed25519.toMontgomerySecret", 32,
        run_ed25519_to_montgomery_secret, &ed25519,
        warmup_ms, budget_ms, repeat_count);
    row("ed25519.verify", 32, run_ed25519_verify, &ed25519,
        warmup_ms, budget_ms, repeat_count);

    struct pbkdf2_context pbkdf2 = {0};
    fill(pbkdf2.password, sizeof(pbkdf2.password), 97);
    fill(pbkdf2.salt, 32, 89);
    row_batch(
        "keystore.pbkdf2Sha256",
        32,
        run_pbkdf2_sha256,
        &pbkdf2,
        1,
        warmup_ms,
        budget_ms,
        repeat_count
    );

    static const uint8_t scrypt_expected[64] = {
        0x77, 0xd6, 0x57, 0x62, 0x38, 0x65, 0x7b, 0x20,
        0x3b, 0x19, 0xca, 0x42, 0xc1, 0x8a, 0x04, 0x97,
        0xf1, 0x6b, 0x48, 0x44, 0xe3, 0x07, 0x4a, 0xe8,
        0xdf, 0xdf, 0xfa, 0x3f, 0xed, 0xe2, 0x14, 0x42,
        0xfc, 0xd0, 0x06, 0x9d, 0xed, 0x09, 0x48, 0xf8,
        0x32, 0x6a, 0x75, 0x3a, 0x0f, 0xc8, 0x1f, 0x17,
        0xe8, 0xd3, 0xe0, 0xfb, 0x2e, 0x0d, 0x36, 0x28,
        0xcf, 0x35, 0xe2, 0x0c, 0x38, 0xd1, 0x89, 0x06,
    };
    struct scrypt_context scrypt_test;
    init_scrypt(&scrypt_test, 16, 1, 1, 64);
    run_scrypt(&scrypt_test);
    CHECK(memcmp(
        scrypt_test.output, scrypt_expected, sizeof(scrypt_expected)) == 0);
    destroy_scrypt(&scrypt_test);

    static const uint32_t scrypt_cases[][3] = {
        {1024, 1, 1},
        {16384, 8, 1},
        {262144, 1, 8},
    };
    for (size_t i = 0;
         i < sizeof(scrypt_cases) / sizeof(scrypt_cases[0]);
         i++) {
        struct scrypt_context scrypt;
        const uint32_t N = scrypt_cases[i][0];
        init_scrypt(
            &scrypt, N, scrypt_cases[i][1], scrypt_cases[i][2], 32);
        fill(scrypt.password, sizeof(scrypt.password), 97);
        scrypt.password_size = sizeof(scrypt.password);
        fill(scrypt.salt, 32, 89);
        scrypt.salt_size = 32;
        row_batch(
            "keystore.scrypt",
            N,
            run_scrypt,
            &scrypt,
            1,
            warmup_ms,
            budget_ms,
            repeat_count
        );
        destroy_scrypt(&scrypt);
    }

    static const uint8_t phrase[] =
        "abandon abandon abandon abandon abandon abandon abandon abandon "
        "abandon abandon abandon about";
    struct mnemonic_context mnemonic = {
        phrase,
        sizeof(phrase) - 1,
        {0},
    };
    row("mnemonic.toSeed", 12, run_mnemonic_to_seed, &mnemonic,
        warmup_ms, budget_ms, repeat_count);

    struct x25519_context x25519 = {0};
    fill(x25519.private_key, sizeof(x25519.private_key), 97);
    fill(x25519.private_key_b, sizeof(x25519.private_key_b), 89);
    ox_x25519_get_public_key(x25519.private_key, x25519.public_key);
    ox_x25519_get_public_key(x25519.private_key_b, x25519.public_key_b);
    run_x25519_get_shared_secret(&x25519);
    uint8_t shared_secret_b[32];
    CHECK(ox_x25519_get_shared_secret(
        x25519.private_key_b, x25519.public_key, shared_secret_b));
    CHECK(memcmp(x25519.output, shared_secret_b, sizeof(shared_secret_b)) == 0);

    row("x25519.getPublicKey", 32, run_x25519_get_public_key, &x25519,
        warmup_ms, budget_ms, repeat_count);
    row("x25519.getSharedSecret", 32, run_x25519_get_shared_secret, &x25519,
        warmup_ms, budget_ms, repeat_count);

    struct secp256k1_context secp256k1 = {0};
    secp256k1.private_key[31] = 1;
    secp256k1.private_key_b[31] = 2;
    fill(secp256k1.payload, sizeof(secp256k1.payload), 251);
    CHECK(ox_secp256k1_init());
    CHECK(ox_secp256k1_get_public_key(
        secp256k1.private_key, secp256k1.public_key));
    CHECK(ox_secp256k1_get_public_key(
        secp256k1.private_key_b, secp256k1.public_key_b));
    CHECK(ox_secp256k1_sign(
        secp256k1.payload,
        sizeof(secp256k1.payload),
        secp256k1.private_key,
        NULL,
        0,
        0,
        secp256k1.signature
    ));
    memcpy(
        secp256k1.compact_signature,
        secp256k1.signature + 1,
        sizeof(secp256k1.compact_signature)
    );
    run_secp256k1_recover_public_key(&secp256k1);
    CHECK(memcmp(
        secp256k1.output,
        secp256k1.public_key,
        sizeof(secp256k1.public_key)
    ) == 0);
    run_secp256k1_verify(&secp256k1);
    CHECK(secp256k1.valid);

    row("secp256k1.getPublicKey", 32,
        run_secp256k1_get_public_key, &secp256k1,
        warmup_ms, budget_ms, repeat_count);
    row("secp256k1.getSharedSecret", 65,
        run_secp256k1_get_shared_secret, &secp256k1,
        warmup_ms, budget_ms, repeat_count);
    row("secp256k1.recoverPublicKey", 32,
        run_secp256k1_recover_public_key, &secp256k1,
        warmup_ms, budget_ms, repeat_count);
    row("secp256k1.sign", 32, run_secp256k1_sign, &secp256k1,
        warmup_ms, budget_ms, repeat_count);
    row("secp256k1.verify", 32, run_secp256k1_verify, &secp256k1,
        warmup_ms, budget_ms, repeat_count);

    return 0;
}
