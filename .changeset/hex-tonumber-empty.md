---
"ox": patch
---

Fixed `Hex.toNumber` (and `Bytes.toNumber`, which delegates to it) returning `NaN` for empty hex (`0x`) instead of throwing, consistent with `Hex.toBigInt`.
