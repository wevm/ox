---
"ox": minor
---

Added `createKeyPair` helper functions for `Bls`, `P256`, and `Secp256k1` modules. These functions provide a convenient way to generate complete key pairs (private key + public key) in a single operation, simplifying key generation workflows and reducing the need for separate `randomPrivateKey` and `getPublicKey` calls.