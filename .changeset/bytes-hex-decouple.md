---
"ox": patch
---

Decoupled `Bytes` and `Hex` modules by routing `Bytes.fromHex`/`Bytes.toHex`/`Bytes.fromNumber`/`Bytes.toBigInt`/`Bytes.toNumber` and `Hex.fromBytes`/`Hex.toBytes`/`Hex.toString` through `internal/codec/*`, deleting the runtime import cycle and adding a safe-integer fast path to `Hex.fromNumber`.
