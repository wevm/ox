---
"ox": minor
---

Added `AesGcm.deriveKey` (returning `{ key, salt, iterations }`), `AesGcm.encryptEnvelope` / `AesGcm.decryptEnvelope` (versioned 12-byte-IV envelope while keeping legacy 16-byte-prefix decrypt support), `Mnemonic.toSeedAsync`, exported `Bls.suite` DST constants, and added optional batch helpers + fixed-size branded blob/commitment/proof types to `Kzg`.
