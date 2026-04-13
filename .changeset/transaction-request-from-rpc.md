---
"ox": patch
---

Fixed `TransactionRequest.fromRpc` in `ox/tempo`. `TransactionRequest.toRpc` now folds top-level `to`/`data`/`value` into `calls` when `calls` is not provided.
