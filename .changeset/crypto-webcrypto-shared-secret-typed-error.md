---
'ox': patch
---

Replaced the plain `Error` thrown by `WebCryptoP256.getSharedSecret` when given an ECDSA private key with a typed `WebCryptoP256.InvalidPrivateKeyAlgorithmError`.
