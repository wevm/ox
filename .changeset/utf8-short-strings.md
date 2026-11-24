---
"ox": patch
---

Made `Bytes.fromString` and `Hex.fromString` encode strings of up to 64 characters in JavaScript instead of calling `TextEncoder`, which is about 3-4x faster for short strings. The output is unchanged, including U+FFFD for lone surrogates. `Address.checksum` no longer bundles a UTF-8 encoder.
