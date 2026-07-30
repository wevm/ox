#include <stdint.h>
#include <string.h>

#include "blake3.h"
#include "blake3_compat.h"
#include "ox_rt.h"

size_t strlen(const char *value) {
  const char *end = value;
  while (*end != '\0')
    end++;
  return (size_t)(end - value);
}

_Static_assert(sizeof(blake3_hasher) == BLAKE3_STATE_SIZE,
               "BLAKE3 state size must match the loader");

__attribute__((export_name("blake3_hash"))) void
blake3_hash(const uint8_t *input, uint32_t input_len, uint8_t *out) {
  blake3_hasher hasher;
  blake3_hasher_init(&hasher);
  blake3_hasher_update(&hasher, input, input_len);
  blake3_hasher_finalize(&hasher, out, BLAKE3_OUT_LEN);
  ox_zero((uint8_t *)&hasher, sizeof(hasher));
}

__attribute__((export_name("blake3_init"))) void
blake3_init(blake3_hasher *state) {
  blake3_hasher_init(state);
}

__attribute__((export_name("blake3_update"))) void
blake3_update(blake3_hasher *state, const uint8_t *input,
              uint32_t input_len) {
  blake3_hasher_update(state, input, input_len);
}

__attribute__((export_name("blake3_finalize"))) void
blake3_finalize(const blake3_hasher *state, uint8_t *out) {
  blake3_hasher_finalize(state, out, BLAKE3_OUT_LEN);
}
