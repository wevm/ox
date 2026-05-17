---
"ox": minor
---

**Added:** `BlobCells` module exposing PeerDAS (EIP-7594) cell-level helpers — `fromBlob` derives the 128 cells + cell KZG proofs of an extended blob, `verify` verifies a batch of cell proofs against their commitments, `recover` reconstructs the full set of cells/proofs from ≥ 64 known cells, and `toDataColumns` builds the 128 per-column packs for a list of blobs.

```diff
+ import { BlobCells, Blobs } from 'ox'
+
+ const blobs = Blobs.from('0xdeadbeef')
+ const columns = BlobCells.toDataColumns(blobs, { kzg }) // 128 columns
```
