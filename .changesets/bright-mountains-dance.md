---
'ox': minor
---

Added [ECDH (Elliptic Curve Diffie-Hellman)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#ecdh) shared secrets to `P256`, `Secp256k1`, and `WebCryptoP256` modules. This enables secure key agreement between parties using elliptic curve cryptography for both secp256k1 and secp256r1 (P256) curves, with support for both `@noble/curves` (for `P256` and `Secp256k1`) implementation and Web Crypto APIs (`WebCryptoP256`).

- `P256.getSharedSecret`
- `Secp256k1.getSharedSecret`
- `WebCryptoP256.getSharedSecret`