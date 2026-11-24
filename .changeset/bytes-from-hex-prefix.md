---
"ox": patch
---

`Bytes.fromHex` (and so `Rlp.fromHex` and every function that reads hex through it) now throws for a value that does not start with `0x`, as ox 1.x does, instead of reading its first two characters as the prefix. For example, `Rlp.fromHex('abcd')` returned `0x81cd`.
