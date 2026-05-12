---
"ox": patch
---

Validated sidecar wrapper cardinality in `TxEnvelopeEip4844.deserialize` so that mismatched `blobs` / `commitments` / `proofs` / `blobVersionedHashes` lengths throw `InvalidSerializedError` instead of fabricating `undefined` sidecar entries via blind indexing in `Blobs.toSidecars`.
