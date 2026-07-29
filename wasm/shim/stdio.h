// Freestanding `stdio.h`. `printf` is referenced by debug helpers in vendored
// C that we never call; each runtime implements it as a no-op.
#ifndef OX_SHIM_STDIO_H
#define OX_SHIM_STDIO_H

typedef struct FILE FILE;

int fscanf(FILE *stream, const char *format, ...);
int printf(const char *format, ...);

#endif // OX_SHIM_STDIO_H
