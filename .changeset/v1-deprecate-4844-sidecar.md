---
"ox": major
---

**Breaking:** Removed the 4844-only blob-sidecar surface in favor of PeerDAS
(EIP-7594).

- `Kzg.Kzg` no longer includes `computeBlobKzgProof`. Bring a PeerDAS-capable
  backend (e.g. `c-kzg` ≥ v1.5, `micro-eth-signer/advanced/kzg.js` ≥ v0.18, or
  equivalent). The backend must implement `computeCells`,
  `computeCellsAndKzgProofs`, `recoverCellsAndKzgProofs`, and
  `verifyCellKzgProofBatch` in addition to `blobToKzgCommitment`.
- Removed `Blobs.toSidecars`, `Blobs.toProofs`,
  `Blobs.sidecarsToVersionedHashes`, `Blobs.BlobSidecar`, and
  `Blobs.BlobSidecars`. Use the upcoming `BlobCells` module (next phase) for
  PeerDAS data-column construction. `Kzg.Kzg.blobToKzgCommitment` and
  `Blobs.toVersionedHashes` remain for transaction versioned-hash derivation.
- Removed `TxEnvelopeEip4844.sidecars` (the legacy "network wrapper" RLP form
  for `eth_sendRawTransaction`). PeerDAS replaces the network wrapper with
  cell/column propagation; the on-chain envelope is unchanged.
