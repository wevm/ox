---
"ox": patch
---

Refactored `Base32` and `Bech32m` to share the `convertBits` repacker, the BIP-173 alphabet table, and the `InvalidPaddingError` class via `internal/codec/bech32-base32.ts`.
