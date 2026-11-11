---
"ox": patch
---

Fixed `TxEnvelopeLegacy.assert`, `TxEnvelopeEip2930.assert`, `TxEnvelopeEip1559.assert` and `TxEnvelopeTempo.assert` to throw `InvalidChainIdError` for a `chainId` that is not a positive safe integer.
