---
"ox": patch
---

Fixed `Signature.toHex` and `Signature.toBytes` to left-pad `r`/`s` values shorter than 32 bytes. An over-long `r`/`s` now throws `Hex.SizeExceedsPaddingSizeError` instead of producing an oversized serialization.
