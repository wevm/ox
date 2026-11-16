---
"ox": patch
---

Fixed `Transaction.fromRpc`, `TransactionReceipt.fromRpc` (including its frame receipts and the `ox/tempo` variant) and `FrameReceipt.fromRpc` to map only known types and statuses, so that values such as `constructor`, `toString` or `__proto__` no longer resolve to `Object.prototype` members.
