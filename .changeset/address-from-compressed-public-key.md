---
"ox": patch
---

Fixed `Address.fromPublicKey` to throw `PublicKey.InvalidPrefixError` for a compressed public key instead of deriving an address from the `x` coordinate alone.
