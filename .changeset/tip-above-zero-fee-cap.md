---
"ox": patch
---

Fixed `TxEnvelopeEip1559`, `TxEnvelopeEip4844`, `TxEnvelopeEip7702`, and `TxEnvelopeTempo` accepting a `maxPriorityFeePerGas` above a zero or empty `maxFeePerGas` in `assert` and `deserialize`.
