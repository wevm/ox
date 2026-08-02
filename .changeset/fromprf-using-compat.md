---
'ox': minor
---

Added `using` (explicit resource management) compatibility to WebAuthn PRF outputs. The `prf` bytes returned by `WebAuthn.createCredential` and `WebAuthn.getCredential` now carry a `Symbol.dispose` handler that zero-fills the secret, so they can be bound with a `using` declaration (or released manually via `prf.fill(0)`).
