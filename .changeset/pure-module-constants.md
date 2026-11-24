---
"ox": patch
---

Marked module-level constants in `Secp256k1`, `P256`, `Ed25519`, `AesGcm`, `Siwe`, `webauthn/Registration`, `trusted-setups/Paths` and `tempo/AccountConfig` as pure, so bundlers drop them when they are unused.
