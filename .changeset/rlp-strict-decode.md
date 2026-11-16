---
"ox": patch
---

Fixed `Rlp.toBytes` and `Rlp.toHex`, and so every `TxEnvelope*.deserialize`, to throw `Rlp.TrailingBytesError` on bytes after the item, `Rlp.ListBoundaryExceededError` when an item overruns its list, and `Rlp.DepthLimitExceededError` when lists nest deeper than 1024.
