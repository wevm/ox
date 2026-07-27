// TIP-1022 salt mining — isomorphic WASM (Node + browser).
// Specialized single-block keccak256 for 52-byte input.
//
// Memory layout, from the first byte past the module's static data:
//   [0..19]   address   (set by JS)
//   [20..51]  salt      (set by JS, incremented in-place)
//   [52..83]  hash out  (written on match)
//
// The base is `__heap_base`, not a fixed address. A literal offset silently
// overlaps whatever the linker placed below it: at 1024 this buffer sat on top
// of the Keccak round constants, so writing the address corrupted `RC[0..6]`
// and every digest came back wrong.

#include "keccak_f1600.h"
#include "ox_rt.h"

// ---------------------------------------------------------------------------
// Mining entry point
// ---------------------------------------------------------------------------

__attribute__((export_name("mine")))
int mine(int count) {
    uint8_t *mem   = (uint8_t *)ox_heap_base();
    uint8_t *addr  = mem;       // 20 bytes
    uint8_t *salt  = mem + 20;  // 32 bytes
    uint8_t *hout  = mem + 52;  // 32 bytes

    // Pre-build base state for 52-byte keccak256 (one block, rate=136).
    // Block = [address(20) | salt(32) | 0x01 | zeros | 0x80]
    // Only lanes 0..6 are non-zero from the message, plus padding in lanes 6 & 16.
    uint64_t base[25];
    for (int i = 0; i < 25; i++) base[i] = 0;

    // Load address into lanes 0..2 (bytes 0..23, only 0..19 used)
    uint8_t buf[24];
    for (int i = 0; i < 20; i++) buf[i] = addr[i];
    for (int i = 20; i < 24; i++) buf[i] = 0;
    base[0] = load64_le(buf);
    base[1] = load64_le(buf + 8);
    base[2] = load64_le(buf + 16);

    // Keccak padding: byte 52 = 0x01, byte 135 = 0x80
    // Lane 6 (bytes 48..55): byte 52 = lane offset 4 → bit 32
    base[6] = (uint64_t)0x01 << 32;
    // Lane 16 (bytes 128..135): byte 135 = lane offset 7 → bit 56
    base[16] = (uint64_t)0x80 << 56;

    for (int iter = 0; iter < count; iter++) {
        // Copy base, XOR salt.
        // Salt occupies bytes 20..51 → lanes 2..6.
        uint64_t A[25];
        for (int i = 0; i < 25; i++) A[i] = base[i];

        // Lane 2 (bytes 16..23): upper 4 bytes = salt[0..3]
        A[2] ^= (uint64_t)load32_le(salt) << 32;
        // Lane 3 (bytes 24..31): salt[4..11]
        A[3] ^= load64_le(salt + 4);
        // Lane 4 (bytes 32..39): salt[12..19]
        A[4] ^= load64_le(salt + 12);
        // Lane 5 (bytes 40..47): salt[20..27]
        A[5] ^= load64_le(salt + 20);
        // Lane 6 (bytes 48..55): lower 4 bytes = salt[28..31]
        A[6] ^= (uint64_t)load32_le(salt + 28);

        keccak_f1600(A);

        // PoW check: first 4 bytes = low 32 bits of lane 0 must be zero.
        if ((uint32_t)A[0] == 0) {
            for (int i = 0; i < 4; i++)
                store64_le(hout + i * 8, A[i]);
            return 1;
        }

        // Increment big-endian salt.
        for (int i = 31; i >= 0; i--) {
            if (salt[i] < 0xFF) { salt[i]++; break; }
            salt[i] = 0;
        }
    }

    return 0;
}
