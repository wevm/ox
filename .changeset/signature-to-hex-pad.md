---
"ox": patch
---

Fixed `Signature.toHex` and `Signature.toBytes` producing a malformed signature when `r` or `s` is shorter than 32 bytes.
