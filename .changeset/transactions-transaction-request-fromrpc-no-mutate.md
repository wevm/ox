---
'ox': patch
---

Fixed `TransactionRequest.fromRpc` mutating the caller-provided RPC object by cloning before assigning parsed fields.
