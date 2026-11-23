---
"ox": patch
---

Marked module-level constants in `Secp256k1`, `P256`, `Ed25519`, `AesGcm`, `MlDsa44`, `WebAuthn`, `Siwe`, `node/Ed25519`, `node/X25519`, `webauthn/Registration`, `trusted-setups/Paths` and `tempo/AccountConfig` as pure, so bundlers drop them when they are unused.
