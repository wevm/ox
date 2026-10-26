---
"ox": patch
---

Fixed `Authorization.fromRpc`, `Authorization.fromTuple`, `Authorization.toTuple`, and the zod `Authorization` schemas rejecting an EIP-7702 authorization `yParity` above 1, which made valid transactions fail to deserialize, serialize, or hash.
