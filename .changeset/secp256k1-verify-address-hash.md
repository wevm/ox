---
"ox": patch
---

Fixed `Secp256k1.verify` to hash the payload with sha256 when `hash: true` is used with `address`, matching the `publicKey` form.
