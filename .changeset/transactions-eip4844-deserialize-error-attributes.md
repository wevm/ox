---
"ox": patch
---

Improved `TxEnvelopeEip4844.deserialize` `InvalidSerializedError` diagnostics by including `maxFeePerBlobGas` and `blobVersionedHashes` in the attributes map and using the EIP-4844 signature-presence threshold (`length > 11`) instead of the EIP-1559 `> 9` copy-paste.
