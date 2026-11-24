---
"ox": patch
---

Fixed `Base58` encoding of empty input and all-zero bytes, and `Base58.toHex` returning odd-length hex for values whose first byte is below `0x10`.
