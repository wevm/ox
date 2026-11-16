---
"ox": patch
---

Fixed `AbiParameters.decode` and `AbiEvent.decode` to throw `AbiParameters.BytesSizeMismatchError` for `bytesN` values whose padding bytes are not zero.
