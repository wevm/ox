---
"ox": patch
---

Added a direct big-endian fast path for `Bytes.fromNumber` and `Bytes.toBigInt` on fixed-width unsigned values, skipping the previous hex round-trip.
