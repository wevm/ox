---
'ox': patch
---

Validated array element types and fixed-array lengths in `TypedData.assert` and `TypedData.encodeField`, throwing `InvalidArrayError`/`InvalidArrayLengthError` instead of silently passing malformed input through to the encoder.
