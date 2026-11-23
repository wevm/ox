---
'ox': patch
---

Fixed `SignatureEnvelope.verify` in `ox/tempo` to reject secp256k1 signatures with a high `s` value, which Tempo does not accept.
