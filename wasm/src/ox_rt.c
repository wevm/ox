#include "ox_rt.h"

// libc replacements. Small and obvious rather than fast: the hot loops in each
// target work on stack buffers, so these are only used for setup.

int memcmp(const void *a, const void *b, size_t n) {
    const uint8_t *x = a, *y = b;
    while (n--) {
        if (*x != *y) return *x - *y;
        x++; y++;
    }
    return 0;
}

void *memcpy(void *dest, const void *src, size_t n) {
    uint8_t *d = dest;
    const uint8_t *s = src;
    while (n--) *d++ = *s++;
    return dest;
}

void *memmove(void *dest, const void *src, size_t n) {
    uint8_t *d = dest;
    const uint8_t *s = src;
    if (d < s) {
        while (n--) *d++ = *s++;
    } else {
        d += n; s += n;
        while (n--) *--d = *--s;
    }
    return dest;
}

void *memset(void *dest, int c, size_t n) {
    uint8_t *d = dest;
    while (n--) *d++ = (uint8_t)c;
    return dest;
}

// Bump allocator. Never frees, because nothing in these targets ever needs to:
// allocation happens once, during a target's `init`, and lives for the lifetime
// of the instance.

static size_t brk = 0;

void *malloc(size_t n) {
    if (!brk) brk = (size_t)&__heap_base;
    size_t ptr = (brk + 15) & ~(size_t)15;
    brk = ptr + n;
    return (void *)ptr;
}

void free(void *ptr) { (void)ptr; }

void *realloc(void *ptr, size_t n) {
    (void)ptr;
    return malloc(n);
}

// A reached `abort` means an invariant inside the module broke, not bad user
// input -- callers validate before entering WASM. `unreachable` surfaces in JS
// as a `RuntimeError`, which the loader turns into an ox error.
void abort(void) { __builtin_trap(); }

int printf(const char *format, ...) {
    (void)format;
    return 0;
}

uint32_t ox_heap_base(void) {
    if (!brk) brk = (size_t)&__heap_base;
    return (uint32_t)brk;
}

void ox_zero(uint8_t *ptr, uint32_t len) {
    volatile uint8_t *p = ptr;
    while (len--) *p++ = 0;
}
