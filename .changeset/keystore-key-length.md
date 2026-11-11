---
"ox": patch
---

Fixed `Keystore.encrypt` and `Keystore.decrypt` to throw `Keystore.InvalidKeySizeError` when the key is shorter than 32 bytes.
