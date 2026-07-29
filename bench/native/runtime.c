#define export_name(name)
#include "../../wasm/src/ox_rt.h"

void ox_zero(uint8_t *ptr, uint32_t len) {
    volatile uint8_t *cursor = ptr;
    while (len--) *cursor++ = 0;
}
