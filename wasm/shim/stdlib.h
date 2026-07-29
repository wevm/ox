// Freestanding `stdlib.h`.
//
// The default `ox_rt.c` uses a bump allocator and no-op `free`. Targets with
// persistent allocations may provide a reclaiming runtime.
#ifndef OX_SHIM_STDLIB_H
#define OX_SHIM_STDLIB_H

#include <stddef.h>

void abort(void);
void *calloc(size_t count, size_t size);
void free(void *ptr);
void *malloc(size_t n);
void *realloc(void *ptr, size_t n);

#endif // OX_SHIM_STDLIB_H
