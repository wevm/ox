---
"ox": patch
---

Fixed `Authorization.fromRpc`, `Authorization.fromTuple`, and `Authorization.toTuple` rejecting an EIP-7702 authorization `yParity` above 1, which made valid transactions fail to deserialize, serialize, or hash.
