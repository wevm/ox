#include "ox_rt.h"

#include <stdlib.h>
#include <string.h>

static int bytes_equal(const uint8_t *a, const uint8_t *b, size_t length) {
    for (size_t i = 0; i < length; i++)
        if (a[i] != b[i]) return 0;
    return 1;
}

__attribute__((export_name("run")))
int ox_rt_test(void) {
    uint8_t overlap[12];
    for (uint8_t i = 0; i < 12; i++) overlap[i] = i;

    memmove(overlap + 2, overlap, 8);
    const uint8_t moved_right[12] = {0, 1, 0, 1, 2, 3, 4, 5, 6, 7, 10, 11};
    if (!bytes_equal(overlap, moved_right, 12)) return 1;

    memmove(overlap, overlap + 2, 8);
    const uint8_t moved_left[12] = {0, 1, 2, 3, 4, 5, 6, 7, 6, 7, 10, 11};
    if (!bytes_equal(overlap, moved_left, 12)) return 2;

    // Separate arrays exercise the case where relational pointer comparison
    // would be undefined; the runtime compares their flat-memory offsets.
    uint8_t source[8];
    uint8_t destination[8];
    for (uint8_t i = 0; i < 8; i++) source[i] = (uint8_t)(0x40 + i);
    memmove(destination, source, 8);
    if (!bytes_equal(destination, source, 8)) return 16;

    uint8_t *first = malloc(16);
    uint8_t *blocker = malloc(16);
    if (!first || !blocker) return 3;
    for (uint8_t i = 0; i < 16; i++) {
        first[i] = (uint8_t)(i + 1);
        blocker[i] = (uint8_t)(0x80 + i);
    }

    // A non-latest allocation must move without losing its existing bytes.
    uint8_t *moved = realloc(first, 32);
    if (!moved || moved == first) return 4;
    for (uint8_t i = 0; i < 16; i++) {
        if (moved[i] != (uint8_t)(i + 1)) return 5;
        if (blocker[i] != (uint8_t)(0x80 + i)) return 6;
    }

    // The most recent allocation can grow and shrink in place.
    uint8_t *latest = malloc(8);
    if (!latest) return 7;
    for (uint8_t i = 0; i < 8; i++) latest[i] = (uint8_t)(0xf0 + i);
    if (realloc(latest, 24) != latest) return 8;
    for (uint8_t i = 0; i < 8; i++)
        if (latest[i] != (uint8_t)(0xf0 + i)) return 9;
    if (realloc(latest, 4) != latest) return 10;
    for (uint8_t i = 0; i < 4; i++)
        if (latest[i] != (uint8_t)(0xf0 + i)) return 11;

    uint8_t *from_null = realloc((void *)0, 8);
    if (!from_null) return 12;
    if (realloc(from_null, 0) != (void *)0) return 13;

    // Failed growth leaves the original allocation and its bytes intact.
    if (realloc(moved, (size_t)-1) != (void *)0) return 14;
    for (uint8_t i = 0; i < 16; i++)
        if (moved[i] != (uint8_t)(i + 1)) return 15;

    return 0;
}
