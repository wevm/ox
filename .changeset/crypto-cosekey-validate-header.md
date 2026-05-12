---
"ox": patch
---

Hardened `CoseKey.toPublicKey` to reject COSE_Key inputs with a non-P-256 `kty`, `alg`, or `crv` header, or with `x`/`y` byte arrays that are not exactly 32 bytes long.
