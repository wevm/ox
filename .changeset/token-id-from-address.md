---
"ox": patch
---

Fixed `TokenId.fromAddress` dropping the high bytes of token IDs above 2^112, so it reads back what `TokenId.toAddress` writes. It now throws `invalid tip20 address.` for an address that is not 20 bytes, instead of reading whatever bytes follow the prefix as the ID.
