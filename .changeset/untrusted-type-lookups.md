---
"ox": patch
---

Fixed `Transaction`, `TransactionReceipt`, `TransactionRequest` and `TypedData` to look up untrusted type names such as `"constructor"` only among their own keys, and `TransactionReceipt` and `FrameReceipt` to do the same for statuses, instead of the object prototype.
