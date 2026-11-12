---
"ox": patch
---

Fixed `SignatureEnvelope.deserialize` and `SignatureEnvelope.fromRpc` in `ox/tempo` to split WebAuthn data into `authenticatorData` and `clientDataJSON` in time linear in its size instead of quadratic.
