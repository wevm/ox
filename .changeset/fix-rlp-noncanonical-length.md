---
"ox": patch
---

Fixed `Rlp.toBytes` and `Rlp.toHex` to reject non-canonical encodings (a single byte below `0x80` with a length prefix, or a long-form or zero-padded length) with `Rlp.NonCanonicalError`.
