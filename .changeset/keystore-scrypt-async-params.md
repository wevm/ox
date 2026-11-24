---
"ox": patch
---

Fixed `Keystore.scryptAsync` ignoring its `r` and `p` options: it always derived with `r: 1, p: 8`, and recorded those in the keystore. So `Keystore.toKeyAsync` derived the wrong key for a scrypt keystore written with other parameters, such as geth's and ethers' (`r: 8, p: 1`), where `Keystore.toKey` derived the right one.
