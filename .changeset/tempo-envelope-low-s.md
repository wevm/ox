---
'ox': patch
---

Fixed `Secp256k1.verify` to reject signatures with a high `s` value when verifying against an `address`, matching the `publicKey` path and fixing `SignatureEnvelope.verify` in `ox/tempo`.
