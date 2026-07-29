#include "ox_rt.h"

#include <stdlib.h>
#include <string.h>

// Reclaiming allocator for c-kzg's persistent setup and per-call scratch.
// Blocks are kept in address order so adjacent free regions can be coalesced.

typedef struct Block {
    size_t size;
    struct Block *next;
} Block;

static const size_t alignment = 16;
static size_t brk = 0;
static Block *free_list = (Block *)0;

static int add_overflows(size_t a, size_t b) {
    return a > (size_t)-1 - b;
}

static size_t align(size_t value) {
    if (add_overflows(value, alignment - 1)) return 0;
    return (value + alignment - 1) & ~(alignment - 1);
}

static int reserve(size_t end) {
    size_t pages = __builtin_wasm_memory_size(0);
    if (end <= pages * 65536) return 1;

    size_t required = (end + 65535) / 65536;
    size_t delta = required - pages;
    return __builtin_wasm_memory_grow(0, delta) != (size_t)-1;
}

void *malloc(size_t size) {
    if (!size) return (void *)0;

    size_t total = align(sizeof(Block) + size);
    if (!total) return (void *)0;

    Block **link = &free_list;
    for (Block *block = free_list; block; block = block->next) {
        if (block->size < total) {
            link = &block->next;
            continue;
        }

        size_t remaining = block->size - total;
        if (remaining >= align(sizeof(Block) + alignment)) {
            Block *next = (Block *)((uint8_t *)block + total);
            next->size = remaining;
            next->next = block->next;
            *link = next;
            block->size = total;
        } else {
            *link = block->next;
        }
        return block + 1;
    }

    if (!brk) brk = align((size_t)&__heap_base);
    if (add_overflows(brk, total)) return (void *)0;

    size_t end = brk + total;
    if (!reserve(end)) return (void *)0;

    Block *block = (Block *)brk;
    block->size = total;
    block->next = (Block *)0;
    brk = end;
    return block + 1;
}

void free(void *ptr) {
    if (!ptr) return;

    Block *block = (Block *)ptr - 1;
    Block **link = &free_list;
    while (*link && (size_t)*link < (size_t)block) link = &(*link)->next;

    block->next = *link;
    *link = block;

    if (block->next &&
        (uint8_t *)block + block->size == (uint8_t *)block->next) {
        block->size += block->next->size;
        block->next = block->next->next;
    }

    if (link != &free_list) {
        Block *previous = free_list;
        while (previous->next != block) previous = previous->next;
        if ((uint8_t *)previous + previous->size == (uint8_t *)block) {
            previous->size += block->size;
            previous->next = block->next;
        }
    }
}

void *calloc(size_t count, size_t size) {
    if (!count || !size || count > (size_t)-1 / size) return (void *)0;

    size_t total = count * size;
    void *ptr = malloc(total);
    if (ptr) memset(ptr, 0, total);
    return ptr;
}

void *realloc(void *ptr, size_t size) {
    if (!ptr) return malloc(size);
    if (!size) {
        free(ptr);
        return (void *)0;
    }

    Block *block = (Block *)ptr - 1;
    size_t current = block->size - sizeof(Block);
    if (size <= current) return ptr;

    void *next = malloc(size);
    if (!next) return (void *)0;
    memcpy(next, ptr, current);
    free(ptr);
    return next;
}

int memcmp(const void *a, const void *b, size_t size) {
    const uint8_t *x = a;
    const uint8_t *y = b;
    while (size--) {
        if (*x != *y) return *x - *y;
        x++;
        y++;
    }
    return 0;
}

void *memcpy(void *dest, const void *src, size_t size) {
    uint8_t *d = dest;
    const uint8_t *s = src;
    while (size--) *d++ = *s++;
    return dest;
}

void *memmove(void *dest, const void *src, size_t size) {
    uint8_t *d = dest;
    const uint8_t *s = src;
    if ((size_t)d < (size_t)s) {
        while (size--) *d++ = *s++;
    } else {
        d += size;
        s += size;
        while (size--) *--d = *--s;
    }
    return dest;
}

void *memset(void *dest, int value, size_t size) {
    uint8_t *d = dest;
    while (size--) *d++ = (uint8_t)value;
    return dest;
}

size_t strlen(const char *value) {
    const char *end = value;
    while (*end) end++;
    return (size_t)(end - value);
}

void abort(void) {
    __builtin_trap();
}

int printf(const char *format, ...) {
    (void)format;
    return 0;
}

int fscanf(void *stream, const char *format, ...) {
    (void)stream;
    (void)format;
    return 0;
}

__attribute__((export_name("alloc"))) uint32_t ox_alloc(uint32_t size) {
    return (uint32_t)malloc(size);
}

__attribute__((export_name("dealloc"))) void ox_dealloc(uint32_t ptr) {
    free((void *)(size_t)ptr);
}

uint32_t ox_heap_base(void) {
    if (!brk) brk = align((size_t)&__heap_base);
    return (uint32_t)brk;
}

void ox_zero(uint8_t *ptr, uint32_t len) {
    volatile uint8_t *p = ptr;
    while (len--) *p++ = 0;
}
