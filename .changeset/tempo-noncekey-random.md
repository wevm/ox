---
'ox': patch
---

Fixed `tempo.TransactionRequest.toRpc` to generate a full 192-bit `nonceKey` when called with `nonceKey: 'random'`, matching the documented field width.
