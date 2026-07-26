// Freestanding `stdio.h`. `printf` is referenced by debug helpers in vendored
// C that we never call; `ox_rt.c` implements it as a no-op.
#ifndef OX_SHIM_STDIO_H
#define OX_SHIM_STDIO_H

int printf(const char *format, ...);

#endif // OX_SHIM_STDIO_H
