---
"ox": patch
---

Fixed `Address.fromPublicKey` to throw `PublicKey.InvalidError` for a compressed public key instead of deriving an address from the `x` coordinate alone.
