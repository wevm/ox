---
"ox": patch
---

Fixed `Hex.toNumber` and `Bytes.toNumber` to throw `Hex.IntegerOutOfRangeError` instead of returning a rounded number or `NaN` when the value is not a safe integer.
