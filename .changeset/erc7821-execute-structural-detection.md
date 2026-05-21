---
'ox': patch
---

Replaced the exception-driven opData fallback in `Execute.decodeBatchOfBatchesData` with structural detection of the ABI head word, so malformed inputs surface as decode errors instead of being masked by the catch.
