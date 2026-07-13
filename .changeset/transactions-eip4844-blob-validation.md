---
'ox': patch
---

Required `blobVersionedHashes` to be present and non-empty in `TxEnvelopeEip4844.assert`; the previous `if (blobVersionedHashes)` guard let envelopes serialize as "blob transactions with no blob hashes".
