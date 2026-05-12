---
"ox": patch
---

Fixed `AbiConstructor.decode` to assert that `data` begins with the provided `bytecode` and throw a new `BytecodeMismatchError` instead of silently returning garbage when the prefix does not match.
