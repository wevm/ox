---
"ox": patch
---

Fixed `Authorization.fromTuple` and `Authorization.fromRpc` to throw `Hex.IntegerOutOfRangeError` for a chain ID that is not a safe integer instead of returning a rounded or `NaN` chain ID.
