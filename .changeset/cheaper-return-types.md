---
"ox": patch
---

Reduced the type instantiations of `Signature` and of the `as`-dependent return types (`Hash`, `Secp256k1`, `P256`, `Ed25519`, `Bls`, `Rlp`, `Cbor` and others) by looking each one up by `as` instead of unioning conditional types, without changing the resolved types. `Signature.from` drops from about 1,360 instantiations to 1,140.
