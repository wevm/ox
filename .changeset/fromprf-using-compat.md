---
'ox': minor
---

Added `using` (explicit resource management) compatibility to PRF secrets. The PRF outputs returned by `WebAuthn.createCredential` and `WebAuthn.getCredential`, and the private keys returned by `Secp256k1.fromPrf`, `Ed25519.fromPrf`, and `MlDsa44.fromPrf` with `as: 'Bytes'`, now carry a `Symbol.dispose` handler that zero-fills the secret, so they can be bound with a `using` declaration (or disposed manually via `secret[Symbol.dispose]()` / `secret.fill(0)`).
