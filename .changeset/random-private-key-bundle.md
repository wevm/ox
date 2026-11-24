---
"ox": patch
---

`Secp256k1`, `P256`, `Ed25519` and `Bls` generate random private keys the way noble does without bundling the curve, so `randomPrivateKey` no longer pulls a whole curve into the bundle.
