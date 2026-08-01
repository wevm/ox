#include "ox_rt.h"
#include "mldsa_native.h"

// ML-DSA-44 (FIPS 204) over mldsa-native's deterministic `_internal` API.
// Private keys cross the boundary as the 32-byte seed; the expanded secret
// key exists only on the WASM stack and is wiped before returning. Randomness
// for hedged signing is supplied by the caller, so the artifact needs no
// entropy import.

// FIPS 204 Algorithm 2: M' = 0x00 || |ctx| || ctx || M. The prefix carries
// the two length bytes plus a context of at most 255 bytes.
#define PREFIX_MAX (2 + 255)

__attribute__((export_name("mldsa44_get_public_key")))
int ox_mldsa44_get_public_key(const uint8_t *seed, uint8_t *public_key) {
    uint8_t secret_key[MLDSA44_SECRETKEYBYTES];
    int result = mld44_keypair_internal(public_key, secret_key, seed);
    ox_zero(secret_key, sizeof(secret_key));
    return result == 0;
}

__attribute__((export_name("mldsa44_sign")))
int ox_mldsa44_sign(const uint8_t *seed, const uint8_t *message,
                    uint32_t message_size, const uint8_t *context,
                    uint32_t context_size, const uint8_t *random,
                    uint8_t *signature) {
    uint8_t public_key[MLDSA44_PUBLICKEYBYTES];
    uint8_t secret_key[MLDSA44_SECRETKEYBYTES];
    uint8_t prefix[PREFIX_MAX];
    size_t signature_size;

    if (context_size > 255) return 0;
    prefix[0] = 0;
    prefix[1] = (uint8_t)context_size;
    for (uint32_t i = 0; i < context_size; i++) prefix[2 + i] = context[i];

    int result = mld44_keypair_internal(public_key, secret_key, seed);
    if (result == 0)
        result = mld44_signature_internal(signature, &signature_size, message,
                                          message_size, prefix,
                                          2 + context_size, random, secret_key,
                                          0);
    ox_zero(secret_key, sizeof(secret_key));
    return result == 0;
}

__attribute__((export_name("mldsa44_verify")))
int ox_mldsa44_verify(const uint8_t *signature, const uint8_t *message,
                      uint32_t message_size, const uint8_t *context,
                      uint32_t context_size, const uint8_t *public_key) {
    uint8_t prefix[PREFIX_MAX];

    if (context_size > 255) return 0;
    prefix[0] = 0;
    prefix[1] = (uint8_t)context_size;
    for (uint32_t i = 0; i < context_size; i++) prefix[2 + i] = context[i];

    return mld44_verify_internal(signature, MLDSA44_BYTES, message,
                                 message_size, prefix, 2 + context_size,
                                 public_key, 0) == 0;
}
