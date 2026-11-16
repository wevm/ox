---
"ox": patch
---

Fixed `Transaction`, `TransactionReceipt`, `TransactionRequest` and `TypedData` to look up untrusted type names such as `"constructor"` only among their own keys instead of the object prototype.
