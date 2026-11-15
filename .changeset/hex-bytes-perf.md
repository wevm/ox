---
"ox": patch
---

Improved the speed and memory use of `Hex` and `Bytes` conversions, ABI decoding, `Blobs.from`, `Blobs.to`, `Base58`, and `TypedData` hashing, and made `Hex.validate`, `Bytes.validate`, and `Address.validate` return `false` without constructing an error.
