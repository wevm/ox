---
"ox": patch
---

Made `Secp256k1.randomPrivateKey`, `P256.randomPrivateKey`, `Bls.randomPrivateKey` and `Ed25519.randomPrivateKey` generate keys without bundling their curve, with the same output as noble's `utils.randomPrivateKey` for the same random bytes.
