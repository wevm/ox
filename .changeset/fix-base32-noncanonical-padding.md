---
"ox": patch
---

Fixed `Base32.toBytes`/`toHex` silently accepting non-canonical trailing bits, which allowed distinct input strings to decode to the same value. Non-canonical padding now throws `Base32.InvalidPaddingError`.
