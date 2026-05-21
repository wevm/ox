---
'ox': major
---

Upgraded `@noble/ciphers`, `@noble/curves`, `@noble/hashes`, `@scure/bip32`, and `@scure/bip39` to v2.

Notable behavioral changes inherited from noble v2:

- ECDSA signatures now default to `lowS: true` for both `Secp256k1` and `P256`. Previously `P256` signatures could have high-S values.
- The `noble` re-exports on `Secp256k1`, `P256`, `Ed25519`, `X25519`, and `Bls` now reference the v2 APIs (e.g. `randomSecretKey()` instead of `randomPrivateKey()`, `Point` instead of `ProjectivePoint`/`ExtendedPoint`, `bls.longSignatures.*` instead of top-level `bls.sign`/`verify`). If you depended on the v1 shape via `Module.noble`, refer to the noble v2 changelog.
