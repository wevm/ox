---
"ox": patch
---

Fixed `TxEnvelopeTempo.assert`, `TxEnvelopeTempo.serialize`, and Tempo `TransactionRequest.fromRpc` to throw for a fee payer signature whose `yParity` is not `0` or `1`, instead of encoding it as `1`.
