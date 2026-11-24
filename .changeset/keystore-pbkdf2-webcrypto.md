---
"ox": patch
---

Improved `Keystore.pbkdf2Async` performance by about 10x by deriving with WebCrypto, falling back to noble where WebCrypto is unavailable.
