---
"ox": patch
---

Fixed `TxEnvelopeTempo.deserialize` throwing a `TypeError` or `SyntaxError` for a field with the wrong RLP shape, such as an authorization with missing fields or a list where a call's value goes; it now throws `TransactionEnvelope.InvalidSerializedError` with the original error as its cause.
