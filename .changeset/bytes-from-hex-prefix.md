---
"ox": minor
---

`Bytes.fromHex` (and so `Rlp.fromHex`, `Rlp.toHex` and every function that reads hex through it) now throws for a value that does not start with `0x`, including an uppercase `0X` prefix, as ox 1.x does, instead of reading its first two characters as the prefix. For example, `Rlp.fromHex('abcd')` returned `0x81cd`, and `Rlp.fromHex('0XAB')` returned `0x81ab`.
