---
"ox": patch
---

Sped up `Bytes.fromHex`, `Bytes.toHex`, `Bytes.fromNumber`, `Bytes.toBigInt`, `Bytes.toNumber`, `Hex.fromBytes`, `Hex.toBytes`, `Hex.toString`, and `Hex.fromNumber` (with a safe-integer fast path) by removing the runtime cycle between `Bytes` and `Hex`.
