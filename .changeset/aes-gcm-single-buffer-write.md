---
"ox": patch
---

Improved `AesGcm.encrypt` to write the IV and ciphertext into a single output buffer, avoiding an extra allocation and copy from `Bytes.concat(iv, ciphertext)`.
