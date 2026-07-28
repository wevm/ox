#include "ox_rt.h"
#include "monocypher.h"
#include "monocypher-ed25519.h"

__attribute__((export_name("ed25519_get_public_key")))
void ox_ed25519_get_public_key(uint8_t *seed, uint8_t *public_key) {
    uint8_t secret_key[64];
    crypto_ed25519_key_pair(secret_key, public_key, seed);
    crypto_wipe(secret_key, sizeof(secret_key));
}

__attribute__((export_name("ed25519_sign")))
void ox_ed25519_sign(uint8_t *seed, const uint8_t *message,
                     uint32_t message_size, uint8_t *signature) {
    uint8_t secret_key[64];
    uint8_t public_key[32];
    crypto_ed25519_key_pair(secret_key, public_key, seed);
    crypto_ed25519_sign(signature, secret_key, message, message_size);
    crypto_wipe(secret_key, sizeof(secret_key));
    crypto_wipe(public_key, sizeof(public_key));
}

__attribute__((export_name("ed25519_verify")))
int ox_ed25519_verify(const uint8_t *signature, const uint8_t *message,
                      uint32_t message_size, const uint8_t *public_key) {
    return crypto_ed25519_check(signature, public_key, message, message_size)
           == 0;
}

__attribute__((export_name("ed25519_to_montgomery_secret")))
void ox_ed25519_to_montgomery_secret(const uint8_t *seed,
                                     uint8_t *secret_key) {
    uint8_t hash[64];
    crypto_sha512(hash, seed, 32);
    for (uint32_t i = 0; i < 32; i++) secret_key[i] = hash[i];
    secret_key[0] &= 248;
    secret_key[31] &= 127;
    secret_key[31] |= 64;
    crypto_wipe(hash, sizeof(hash));
}

__attribute__((export_name("x25519_get_public_key")))
void ox_x25519_get_public_key(const uint8_t *private_key,
                              uint8_t *public_key) {
    crypto_x25519_public_key(public_key, private_key);
}

__attribute__((export_name("x25519_get_shared_secret")))
int ox_x25519_get_shared_secret(const uint8_t *private_key,
                                const uint8_t *public_key,
                                uint8_t *shared_secret) {
    crypto_x25519(shared_secret, private_key, public_key);
    uint8_t nonzero = 0;
    for (uint32_t i = 0; i < 32; i++) nonzero |= shared_secret[i];
    return nonzero != 0;
}

__attribute__((export_name("mnemonic_to_seed")))
void ox_mnemonic_to_seed(const uint8_t *password, uint32_t password_size,
                         const uint8_t *salt, uint32_t salt_size,
                         uint8_t *seed) {
    crypto_sha512_hmac_ctx context;
    uint8_t block_index[4] = {0, 0, 0, 1};
    uint8_t u[64];

    crypto_sha512_hmac_init(&context, password, password_size);
    crypto_sha512_hmac_update(&context, salt, salt_size);
    crypto_sha512_hmac_update(&context, block_index, sizeof(block_index));
    crypto_sha512_hmac_final(&context, u);
    for (uint32_t i = 0; i < 64; i++) seed[i] = u[i];

    for (uint32_t iteration = 1; iteration < 2048; iteration++) {
        crypto_sha512_hmac(u, password, password_size, u, sizeof(u));
        for (uint32_t i = 0; i < 64; i++) seed[i] ^= u[i];
    }

    crypto_wipe(&context, sizeof(context));
    crypto_wipe(block_index, sizeof(block_index));
    crypto_wipe(u, sizeof(u));
}
