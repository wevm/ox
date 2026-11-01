---
"ox": patch
---

Fixed `TxEnvelopeEip1559.assert`, `TxEnvelopeEip4844.assert`, `TxEnvelopeEip7702.assert`, and `TxEnvelopeTempo.assert` accepting a `maxPriorityFeePerGas` above a zero `maxFeePerGas`. Their `deserialize` functions now read an empty `maxFeePerGas` as zero when a tip is set, so such a transaction throws `TransactionEnvelope.TipAboveFeeCapError`. Zero fees now show in the error messages.
