---
'ox': minor
---

Added `TransactionRequest.toEnvelope` and `TransactionEnvelope.toTransactionRequest` for converting between `TransactionRequest` and `TxEnvelope*` shapes (e.g. when handling `eth_sendTransaction`). Extended `TransactionRequest` with optional `r`, `s`, `yParity`, `v` fields so signed payloads can be carried in the same type (with hex↔native coercion in `fromRpc`/`toRpc`). Also tightened `TransactionEnvelope.getType` to throw on accidental RPC-style type strings (`'0x0'`–`'0x4'`); pass payloads through `TransactionRequest.fromRpc` first.
