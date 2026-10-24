---
"ox": patch
---

Fixed `TypedData.extractEip712DomainTypes` (and `TypedData.encode`, `TypedData.getSignPayload`, `TypedData.hashDomain`) dropping an empty `version` from the `EIP712Domain` type.
