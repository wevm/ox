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

__attribute__((export_name("blake3_hash"))) void
blake3_hash(const uint8_t *input, uint32_t input_len, uint8_t *out) {
  blake3_hasher hasher;
  blake3_hasher_init(&hasher);
  blake3_hasher_update(&hasher, input, input_len);
  blake3_hasher_finalize(&hasher, out, BLAKE3_OUT_LEN);
  ox_zero((uint8_t *)&hasher, sizeof(hasher));
}
