---
'ox': minor
---

Added `TransactionRequest.toEnvelope` (in `ox/tempo`) and `TxEnvelopeTempo.toTransactionRequest` for converting between Tempo `TransactionRequest` and `TxEnvelopeTempo` shapes. `toEnvelope` folds flat `{ to, data, value }` requests into `calls[]`, resolves `nonceKey: 'random'`, and drops fields not supported by the Tempo envelope (`blobs`, `gasPrice`, core `r`/`s`/`yParity`/`v`). Extended Tempo's `TransactionRequest` with optional `signature` (`SignatureEnvelope`) and `feePayerSignature` (`Signature.Signature<true>`) fields so signed envelopes can be round-tripped without information loss; `fromRpc`/`toRpc` translate them via the existing `SignatureEnvelope.fromRpc`/`toRpc` and `Signature.fromRpc`/`toRpc` helpers.
