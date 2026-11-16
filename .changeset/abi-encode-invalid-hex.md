---
"ox": patch
---

Fixed `AbiParameters.encode` and the ABI encoders built on it to throw `Hex.InvalidHexValueError` for `bytes` values containing non-hex characters instead of copying those characters into the output.
