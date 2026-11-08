---
"ox": patch
---

Fixed `Hex.toBigInt` and `Hex.toNumber` throwing on odd-length hex with `signed: true`, and `Hex.fromNumber` returning `0x0` for a negative number with `signed: true` and no `size`.
