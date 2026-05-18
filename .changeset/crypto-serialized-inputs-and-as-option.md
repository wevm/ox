---
"ox": minor
---

Added `as: 'Hex' | 'Bytes' | 'Object'` option to `Secp256k1.sign` / `getPublicKey` / `recoverPublicKey`, `P256.sign` / `getPublicKey` / `recoverPublicKey`, `WebCryptoP256.sign`, and `Bls.sign` / `getPublicKey` (default `'Object'` keeps existing behavior); plus accept `Hex.Hex | Bytes.Bytes | Signature.Signature` for `signature` params and `Hex.Hex | Bytes.Bytes | PublicKey.PublicKey` for `publicKey` params on `verify`, `recoverAddress`, `recoverPublicKey`, `getSharedSecret` across the same modules.
