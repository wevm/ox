---
"ox": patch
---

Fixed `PublicKey.fromHex` and `PublicKey.fromBytes` so they reject deserialized public keys with an invalid SEC1 prefix.
