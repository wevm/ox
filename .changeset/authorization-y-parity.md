---
"ox": patch
---

Fixed `Authorization.fromRpc`, `Authorization.fromTuple`, `Authorization.toTuple`, and `Authorization.toRpc` rejecting or rewriting an EIP-7702 authorization `yParity` above 1, which made valid transactions fail to deserialize, serialize, or hash.
