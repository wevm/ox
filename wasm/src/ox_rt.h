// Minimal freestanding runtime shared by every ox WASM target.
//
// We compile with `-nostdlib -ffreestanding`, so there is no libc. Clang still
// provides the freestanding headers (`stdint.h`, `stddef.h`), but anything that
// would normally come from libc lives here or in `ox_rt.c`.

#ifndef OX_RT_H
#define OX_RT_H

#ifdef OX_RT_HOST
// Native benchmarks use the host ABI's standard integer definitions.
#include <stddef.h>
#include <stdint.h>
#else
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long long uint64_t;
typedef unsigned long size_t;
#endif

/** Start of the region JS may write to. Emitted by `wasm-ld`. */
extern unsigned char __heap_base;

/**
 * Address of the first byte JS may use.
 *
 * Targets that allocate internally (a vendored library building a context, say)
 * must be initialized before JS reads this, because the allocator advances past
 * whatever it hands out.
 */
__attribute__((export_name("heap_base"))) uint32_t ox_heap_base(void);

/** Overwrites a region with zeroes, in a way the optimizer may not elide. */
__attribute__((export_name("zero"))) void ox_zero(uint8_t *ptr, uint32_t len);

#endif // OX_RT_H
