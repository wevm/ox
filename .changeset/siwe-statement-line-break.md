---
"ox": patch
---

Fixed `Siwe.createMessage` to throw `InvalidMessageFieldError` when `statement` contains a carriage return, `U+2028` or `U+2029`.
