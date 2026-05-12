---
"ox": patch
---

Fixed `Transaction.toRpc` emitting `null` for `transactionIndex: 0` instead of `0x0`.
