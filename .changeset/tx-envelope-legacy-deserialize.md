---
"ox": patch
---

Fixed `TxEnvelopeLegacy.deserialize` to validate unsigned transactions and to reject nested lists, a `v` above the safe integer range, and `gasPrice`, `r` or `s` values longer than 32 bytes.
