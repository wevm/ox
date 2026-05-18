---
"ox": patch
---

Fixed `WebCryptoP256.verify` rejecting valid signatures whose `r` or `s` value has a leading zero byte by padding both components to 32 bytes.
