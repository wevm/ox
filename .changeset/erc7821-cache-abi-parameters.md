---
'ox': patch
---

Cached the `Calls` ABI parameter lists (with and without `opData`) and the `bytes[]` parameter used by `Execute.encodeBatchOfBatchesData`/`decodeBatchOfBatchesData` at module scope to avoid reparsing on every encode/decode.
