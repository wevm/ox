// Freestanding `stdlib.h`.
//
// `malloc` is a bump allocator and `free` is a no-op -- see `ox_rt.c`. Allocation
// metadata is retained so `realloc` still preserves existing bytes.
#ifndef OX_SHIM_STDLIB_H
#define OX_SHIM_STDLIB_H

#include <stddef.h>

void abort(void);
void free(void *ptr);
void *malloc(size_t n);
void *realloc(void *ptr, size_t n);

#endif // OX_SHIM_STDLIB_H
