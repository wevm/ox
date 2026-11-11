---
"ox": patch
---

Fixed `TxEnvelopeLegacy.hash` (with `presign`) and `TxEnvelopeLegacy.getSignPayload` to derive the chain ID from an EIP-155 `v` when the envelope has no `chainId`.
