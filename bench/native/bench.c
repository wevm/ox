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

void blake3_hash(const uint8_t *, uint32_t, uint8_t *);
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
void ox_keccak256(const uint8_t *, uint32_t, uint8_t *);
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

struct hash_context {
    const uint8_t *input;
    uint32_t input_size;
    uint8_t key[32];
    uint8_t output[32];
    union hash_scratch scratch;
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
