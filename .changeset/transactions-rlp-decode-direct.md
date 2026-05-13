---
"ox": patch
---

Sped up `TxEnvelopeEip1559.deserialize`, `TxEnvelopeEip2930.deserialize`, `TxEnvelopeEip4844.deserialize`, `TxEnvelopeEip7702.deserialize`, and `TxEnvelopeLegacy.deserialize` by decoding RLP payloads directly to bytes and reusing shared transaction quantity helpers.
