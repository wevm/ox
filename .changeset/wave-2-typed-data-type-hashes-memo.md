---
"ox": minor
---

Threaded an optional `typeHashes` cache through `TypedData.encode`, `TypedData.hashStruct`, and `TypedData.hashDomain` so `keccak256(encodeType(t))` is computed once per `(primaryType, types)` per call instead of once per nested struct or array element. `TypedData.encode` populates a fresh map internally; advanced callers signing many messages against the same schema can pass a shared `Map<string, Hex.Hex>` across calls.
