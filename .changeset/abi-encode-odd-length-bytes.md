---
"ox": patch
---

Fixed `AbiParameters.encode` to reject `bytes` and `bytesN` values with an odd number of hex digits, and `TypedData.assert` to reject such `bytesN` values, instead of encoding them with a trailing zero nibble.
