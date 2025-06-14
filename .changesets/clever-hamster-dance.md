---
"ox": minor
---

Added `createKeyPair` functions for BLS, P256, and Secp256k1 cryptographic modules. These functions provide a convenient way to generate complete key pairs (private key + public key) in a single operation, simplifying key generation workflows and reducing the need for separate `randomPrivateKey` and `getPublicKey` calls.