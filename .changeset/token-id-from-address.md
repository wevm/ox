---
"ox": patch
---

Fixed `TokenId.fromAddress` dropping the high bytes of token IDs above 2^112, so it reads back what `TokenId.toAddress` writes.
