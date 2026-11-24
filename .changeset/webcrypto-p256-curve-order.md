---
"ox": patch
---

Made `WebCryptoP256.sign` and `WebCryptoP256.verify` normalize and check `s` against P-256's order without bundling noble's curve, which makes their bundles about 7x smaller.
