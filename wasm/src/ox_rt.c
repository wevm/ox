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
    // Relational comparisons between pointers to different C objects are
    // undefined. WASM pointers are offsets into one flat linear memory, so
    // compare those offsets instead.
    if ((size_t)d < (size_t)s) {
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

// Bump allocator. `free` is deliberately a no-op because target allocation
// happens during initialization and lives for the instance's lifetime. A size
// word immediately before each aligned allocation lets `realloc` preserve data.

static size_t brk = 0;

static int add_overflows(size_t a, size_t b) {
    return a > (size_t)-1 - b;
}

static int is_in_memory(size_t end) {
    const size_t pages = __builtin_wasm_memory_size(0);
    // A full 4 GiB wasm32 memory has an exclusive end that cannot be represented
    // by size_t. Every representable address is valid in that case.
    if (pages >= 65536) return 1;
    return end <= pages * 65536;
}

void *malloc(size_t n) {
    if (!n) return (void *)0;
    if (!brk) brk = (size_t)&__heap_base;

    // Leave one size word before a 16-byte-aligned user pointer.
    if (add_overflows(brk, sizeof(size_t) + 15)) return (void *)0;
    const size_t ptr = (brk + sizeof(size_t) + 15) & ~(size_t)15;
    if (add_overflows(ptr, n)) return (void *)0;

    const size_t end = ptr + n;
    if (!is_in_memory(end)) return (void *)0;

    *(size_t *)(ptr - sizeof(size_t)) = n;
    brk = end;
    return (void *)ptr;
}

void free(void *ptr) { (void)ptr; }

void *realloc(void *ptr, size_t n) {
    if (!ptr) return malloc(n);
    if (!n) {
        free(ptr);
        return (void *)0;
    }

    const size_t address = (size_t)ptr;
    size_t *header = (size_t *)(address - sizeof(size_t));
    const size_t old = *header;

    if (n <= old) {
        *header = n;
        if (!add_overflows(address, old) && address + old == brk)
            brk = address + n;
        return ptr;
    }

    // The most recent allocation can grow in place while preserving its bytes.
    if (!add_overflows(address, old) && address + old == brk) {
        if (add_overflows(address, n)) return (void *)0;
        const size_t end = address + n;
        if (!is_in_memory(end)) return (void *)0;
        *header = n;
        brk = end;
        return ptr;
    }

    void *next = malloc(n);
    if (!next) return (void *)0;
    memcpy(next, ptr, old);
    return next;
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
