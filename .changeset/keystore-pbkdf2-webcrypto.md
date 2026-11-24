---
"ox": patch
---

`Keystore.pbkdf2Async` derives keys with WebCrypto's native PBKDF2 where it is available, which is about 10x faster than noble's, and falls back to noble otherwise.
