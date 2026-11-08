---
"ox": patch
---

Fixed `AbiError.decode` to resolve overloaded errors by the selector in `data` instead of always decoding with the first matching overload.
