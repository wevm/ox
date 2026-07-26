// Freestanding `string.h`. We build with `-nostdlib`, so the declarations third
// party C expects are provided here and implemented in `ox_rt.c`.
#ifndef OX_SHIM_STRING_H
#define OX_SHIM_STRING_H

#include <stddef.h>

int memcmp(const void *a, const void *b, size_t n);
void *memcpy(void *dest, const void *src, size_t n);
void *memmove(void *dest, const void *src, size_t n);
void *memset(void *dest, int c, size_t n);

#endif // OX_SHIM_STRING_H
