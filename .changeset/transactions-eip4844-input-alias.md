---
"ox": patch
---

Fixed `TxEnvelopeEip4844.serialize` ignoring the `input` alias for `data`; calldata supplied via `input` is now included in the serialized envelope and sign payload.
