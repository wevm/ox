---
"ox": patch
---

Fixed `SignatureEnvelope.deserialize` and `SignatureEnvelope.fromRpc` to reject WebAuthn signatures larger than the 2048-byte protocol maximum.
