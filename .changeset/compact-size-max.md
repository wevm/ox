---
"ox": patch
---

Fixed `CompactSize.toBytes` and `CompactSize.toHex` silently wrapping values above 2^64 - 1; they now throw `Hex.IntegerOutOfRangeError`.
