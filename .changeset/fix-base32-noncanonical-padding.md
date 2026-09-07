---
"ox": patch
---

Fixed `Base32.toBytes`/`toHex` silently accepting non-canonical trailing bits, which allowed distinct input strings to decode to the same value. Non-canonical padding now throws `Base32.InvalidPaddingError`. Strings whose length cannot be produced by `Base32.fromBytes` (length ≡ 1, 3, or 6 mod 8) are rejected with the same error.
