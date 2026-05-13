---
"ox": patch
---

Added specialised primitive-topic encode/decode paths to `AbiEvent.encode` and `AbiEvent.decode` that handle `address`, `bool`, `uintN`, `intN`, and `bytesN` indexed parameters directly, skipping the generic `AbiParameters` cursor + `Bytes.fromHex` round-trip.
