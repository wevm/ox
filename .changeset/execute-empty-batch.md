---
"ox": patch
---

Fixed `Execute.decodeBatchOfBatchesData` inventing an `opData` for a batch with no calls; it now reads the encoding's first offset, as ERC-7821 accounts do.
