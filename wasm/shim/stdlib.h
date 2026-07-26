// Freestanding `stdlib.h`.
//
// `malloc` is a bump allocator that never frees -- see `ox_rt.c`. It exists only
// because some vendored libraries allocate once, during initialization.
#ifndef OX_SHIM_STDLIB_H
#define OX_SHIM_STDLIB_H

#include <stddef.h>

void abort(void);
void free(void *ptr);
void *malloc(size_t n);
void *realloc(void *ptr, size_t n);

#endif // OX_SHIM_STDLIB_H
