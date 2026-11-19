---
"ox": patch
---

Fixed `Authorization.toRpc` (and so `TransactionRequest.toRpc`, `Transaction.toRpc` and the `eip7702Auth` of `UserOperation.toRpc`) to encode `r` and `s` as `uint256` quantities without leading zeros, which geth-based nodes require.
