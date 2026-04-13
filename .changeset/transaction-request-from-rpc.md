---
"ox": patch
---

Added `TransactionRequest.fromRpc` to `ox/tempo`. `TransactionRequest.toRpc` now folds top-level `to`/`data`/`value` into `calls` when `calls` is not provided.
