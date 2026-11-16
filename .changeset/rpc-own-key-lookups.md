---
"ox": patch
---

Fixed `Transaction.fromRpc` and `TransactionReceipt.fromRpc` to map only known types and statuses, so that values such as `constructor`, `toString` or `__proto__` no longer resolve to `Object.prototype` members.
