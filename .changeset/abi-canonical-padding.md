---
"ox": patch
---

Fixed `AbiParameters.decode` to throw `AbiParameters.BytesSizeMismatchError` when a `bytesN` value has non-zero padding, and `AbiEvent.decode` to throw `AbiEvent.TopicSizeMismatchError` when a topic for a statically typed indexed parameter is not 32 bytes.
