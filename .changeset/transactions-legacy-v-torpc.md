---
'ox': patch
---

Fixed `TxEnvelopeLegacy.toRpc` collapsing every signed legacy envelope to `v: '0x1b'`/`'0x1c'`; it now preserves an explicit `envelope.v`, otherwise derives EIP-155 `v = chainId * 2 + 35 + yParity` when a chain ID is present.
