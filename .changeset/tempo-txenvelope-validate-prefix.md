---
'ox': patch
---

Fixed `tempo.TxEnvelopeTempo.deserialize` to validate the `0x76` envelope-type prefix before RLP decoding, rejecting payloads from other envelope types.
