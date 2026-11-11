---
"ox": patch
---

Fixed `SignatureEnvelope.assert`, `deserialize`, `fromRpc`, and `toRpc` to reject a keychain signature whose inner signature is itself a keychain signature.
