---
"ox": patch
---

Reduced the type instantiations of `Signature` and `Signature.toRpc`'s input, of the `as`-dependent return types (`Hash`, `Secp256k1`, `P256`, `Ed25519`, `Bls`, `Rlp` and others), and of `Rlp.fromHex` and `Rlp.fromBytes` options, without changing the resolved types.
