#include "ox_rt.h"

/*
 * Build libsecp256k1 and the Ox ABI in one translation unit. This keeps the
 * vendored library's internal SHA-256 and scalar helpers available for exact
 * Noble-compatible message and nonce normalization.
 */
#include "../vendor/secp256k1/src/secp256k1.c"

typedef struct {
    const uint8_t *entropy;
    uint32_t entropy_size;
} ox_nonce_data;

static secp256k1_context ox_secp256k1_context;
static int ox_secp256k1_initialized;

static secp256k1_context *ox_secp256k1_get_context(void) {
    if (!ox_secp256k1_initialized) {
        if (secp256k1_context_preallocated_create(
                &ox_secp256k1_context, SECP256K1_CONTEXT_NONE) == NULL)
            return NULL;
        ox_secp256k1_initialized = 1;
    }
    return &ox_secp256k1_context;
}

static void ox_secp256k1_prepare_message(
    uint8_t output[32],
    const uint8_t *message,
    uint32_t message_size,
    int prehash
) {
    if (prehash) {
        secp256k1_sha256 hash;
        secp256k1_sha256_initialize(&hash);
        secp256k1_sha256_write(&hash, message, message_size);
        secp256k1_sha256_finalize(&hash, output);
        secp256k1_sha256_clear(&hash);
        return;
    }

    memset(output, 0, 32);
    if (message_size >= 32)
        memcpy(output, message, 32);
    else
        memcpy(output + 32 - message_size, message, message_size);
}

static void ox_secp256k1_hmac(
    uint8_t output[32],
    const uint8_t key[32],
    const uint8_t value[32],
    const uint8_t *control,
    const uint8_t private_key[32],
    const uint8_t message[32],
    const ox_nonce_data *data
) {
    secp256k1_hmac_sha256 hash;
    secp256k1_hmac_sha256_initialize(&hash, key, 32);
    secp256k1_hmac_sha256_write(&hash, value, 32);
    if (control != NULL) {
        secp256k1_hmac_sha256_write(&hash, control, 1);
        secp256k1_hmac_sha256_write(&hash, private_key, 32);
        secp256k1_hmac_sha256_write(&hash, message, 32);
        if (data->entropy_size)
            secp256k1_hmac_sha256_write(
                &hash, data->entropy, data->entropy_size);
    }
    secp256k1_hmac_sha256_finalize(&hash, output);
    secp256k1_hmac_sha256_clear(&hash);
}

static int ox_secp256k1_nonce(
    uint8_t nonce[32],
    const uint8_t message[32],
    const uint8_t private_key[32],
    const uint8_t *algorithm,
    void *opaque,
    unsigned int attempt
) {
    static const uint8_t zero = 0;
    static const uint8_t one = 1;
    const ox_nonce_data *data = opaque;
    secp256k1_scalar scalar;
    uint8_t reduced[32];
    uint8_t key[32];
    uint8_t value[32];

    (void)algorithm;
    if (attempt >= 1000) return 0;

    secp256k1_scalar_set_b32(&scalar, message, NULL);
    secp256k1_scalar_get_b32(reduced, &scalar);
    memset(key, 0, sizeof(key));
    memset(value, 1, sizeof(value));

    ox_secp256k1_hmac(
        key, key, value, &zero, private_key, reduced, data);
    ox_secp256k1_hmac(
        value, key, value, NULL, private_key, reduced, data);
    ox_secp256k1_hmac(
        key, key, value, &one, private_key, reduced, data);
    ox_secp256k1_hmac(
        value, key, value, NULL, private_key, reduced, data);

    for (unsigned int i = 0; i <= attempt; i++) {
        if (i) {
            ox_secp256k1_hmac(
                key, key, value, &zero, private_key, reduced, data);
            ox_secp256k1_hmac(
                value, key, value, NULL, private_key, reduced, data);
        }
        ox_secp256k1_hmac(
            value, key, value, NULL, private_key, reduced, data);
    }
    memcpy(nonce, value, 32);

    secp256k1_scalar_clear(&scalar);
    secp256k1_memclear_explicit(reduced, sizeof(reduced));
    secp256k1_memclear_explicit(key, sizeof(key));
    secp256k1_memclear_explicit(value, sizeof(value));
    return 1;
}

static int ox_secp256k1_serialize_shared_point(
    uint8_t *output,
    const uint8_t x[32],
    const uint8_t y[32],
    void *data
) {
    (void)data;
    output[0] = 2 | (y[31] & 1);
    memcpy(output + 1, x, 32);
    return 1;
}

__attribute__((export_name("secp256k1_init")))
int ox_secp256k1_init(void) {
    return ox_secp256k1_get_context() != NULL;
}

__attribute__((export_name("secp256k1_randomize")))
int ox_secp256k1_randomize(const uint8_t seed[32]) {
    secp256k1_context *context = ox_secp256k1_get_context();
    if (context == NULL) return 0;
    return secp256k1_context_randomize(context, seed);
}

__attribute__((export_name("secp256k1_get_public_key")))
int ox_secp256k1_get_public_key(
    const uint8_t private_key[32],
    uint8_t public_key[65]
) {
    secp256k1_context *context = ox_secp256k1_get_context();
    secp256k1_pubkey parsed;
    size_t size = 65;
    if (context == NULL ||
        !secp256k1_ec_pubkey_create(context, &parsed, private_key))
        return 0;
    return secp256k1_ec_pubkey_serialize(
        context, public_key, &size, &parsed, SECP256K1_EC_UNCOMPRESSED);
}

__attribute__((export_name("secp256k1_get_shared_secret")))
int ox_secp256k1_get_shared_secret(
    const uint8_t private_key[32],
    const uint8_t *public_key,
    uint32_t public_key_size,
    uint8_t shared_secret[33]
) {
    secp256k1_context *context = ox_secp256k1_get_context();
    secp256k1_pubkey parsed;
    if (context == NULL ||
        !secp256k1_ec_pubkey_parse(
            context, &parsed, public_key, public_key_size))
        return 0;
    return secp256k1_ecdh(
        context,
        shared_secret,
        &parsed,
        private_key,
        ox_secp256k1_serialize_shared_point,
        NULL);
}

__attribute__((export_name("secp256k1_recover_public_key")))
int ox_secp256k1_recover_public_key(
    const uint8_t signature[65],
    const uint8_t *message,
    uint32_t message_size,
    uint8_t public_key[65]
) {
    secp256k1_context *context = ox_secp256k1_get_context();
    secp256k1_ecdsa_recoverable_signature parsed_signature;
    secp256k1_pubkey parsed_public_key;
    uint8_t message32[32];
    size_t public_key_size = 65;
    int result = 0;

    ox_secp256k1_prepare_message(message32, message, message_size, 0);
    if (context != NULL && signature[0] <= 1 &&
        secp256k1_ecdsa_recoverable_signature_parse_compact(
            context, &parsed_signature, signature + 1, signature[0]) &&
        secp256k1_ecdsa_recover(
            context, &parsed_public_key, &parsed_signature, message32))
        result = secp256k1_ec_pubkey_serialize(
            context,
            public_key,
            &public_key_size,
            &parsed_public_key,
            SECP256K1_EC_UNCOMPRESSED);

    secp256k1_memclear_explicit(message32, sizeof(message32));
    return result;
}

__attribute__((export_name("secp256k1_sign")))
int ox_secp256k1_sign(
    const uint8_t *message,
    uint32_t message_size,
    const uint8_t private_key[32],
    const uint8_t *entropy,
    uint32_t entropy_size,
    int prehash,
    uint8_t signature[65]
) {
    secp256k1_context *context = ox_secp256k1_get_context();
    secp256k1_ecdsa_recoverable_signature parsed;
    ox_nonce_data data = {entropy, entropy_size};
    uint8_t message32[32];
    int recovery = 0;
    int result = 0;

    ox_secp256k1_prepare_message(
        message32, message, message_size, prehash);
    if (context != NULL &&
        secp256k1_ecdsa_sign_recoverable(
            context,
            &parsed,
            message32,
            private_key,
            ox_secp256k1_nonce,
            &data)) {
        result = secp256k1_ecdsa_recoverable_signature_serialize_compact(
            context, signature + 1, &recovery, &parsed);
        signature[0] = recovery;
    }

    secp256k1_memclear_explicit(&data, sizeof(data));
    secp256k1_memclear_explicit(message32, sizeof(message32));
    return result;
}

__attribute__((export_name("secp256k1_verify")))
int ox_secp256k1_verify(
    const uint8_t signature[64],
    const uint8_t *message,
    uint32_t message_size,
    const uint8_t *public_key,
    uint32_t public_key_size,
    int prehash
) {
    secp256k1_context *context = ox_secp256k1_get_context();
    secp256k1_ecdsa_signature parsed_signature;
    secp256k1_pubkey parsed_public_key;
    uint8_t message32[32];
    int result = 0;

    ox_secp256k1_prepare_message(
        message32, message, message_size, prehash);
    if (context != NULL &&
        secp256k1_ecdsa_signature_parse_compact(
            context, &parsed_signature, signature) &&
        secp256k1_ec_pubkey_parse(
            context, &parsed_public_key, public_key, public_key_size))
        result = secp256k1_ecdsa_verify(
            context, &parsed_signature, message32, &parsed_public_key);

    secp256k1_memclear_explicit(message32, sizeof(message32));
    return result;
}
