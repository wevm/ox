---
"ox": patch
---

Fixed `WebCryptoP256.verify` rejecting valid signatures whose `r` or `s` has a leading zero byte (about 1 in 128).
