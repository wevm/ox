---
"ox": patch
---

Fixed `Keystore.toKeyAsync` to use the async PBKDF2 implementation -- previously it called the synchronous `pbkdf2` helper and blocked the main thread when decrypting PBKDF2-backed keystores.
