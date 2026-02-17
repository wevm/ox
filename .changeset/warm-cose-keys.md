---
"ox": patch
---

Added `CoseKey` module with `fromPublicKey` and `toPublicKey` for converting between P256 public keys and CBOR-encoded COSE_Key format.
Added `Map` support to `Cbor.encode` for encoding maps with non-string keys (e.g. CBOR integer keys).
Fixed COSE key encoding in `WebAuthnP256.getAuthenticatorData` to use CBOR integer keys.
Fixed `WebAuthnP256.verify` type-check slice bug.
