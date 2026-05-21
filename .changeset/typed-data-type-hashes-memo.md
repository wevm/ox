---
'ox': minor
---

Threaded an optional `typeHashes` cache through `TypedData.encode`, `TypedData.hashStruct`, and `TypedData.hashDomain` so `keccak256(encodeType(t))` is computed once per `(primaryType, types)` per call instead of once per nested struct or array element (with `TypedData.encode` populating a fresh map internally and advanced callers able to share a `Map<string, Hex.Hex>` across calls).
