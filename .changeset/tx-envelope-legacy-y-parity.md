---
"ox": patch
---

Fixed `TxEnvelopeLegacy.serialize` and `TxEnvelopeLegacy.hash` throwing for a signed envelope that has `yParity` but no (deprecated) `v`.
