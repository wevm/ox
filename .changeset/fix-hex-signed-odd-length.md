---
"ox": patch
---

Fixed `Hex.toBigInt`/`Hex.toNumber` throwing a `RangeError` when decoding odd-length hex with `signed: true` (including `Hex`'s own `fromNumber` output), and `Hex.fromNumber` silently returning `0x0` for a negative `number` value with `signed: true` and no explicit `size`.
