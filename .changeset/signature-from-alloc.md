---
"ox": patch
---

Made `Signature.from`, `Signature.extract` and `Signature.assert` validate 32-byte `r` and `s` without parsing them as BigInts, and `Hex.padLeft`/`Hex.padRight` return a value that already has the size as is, which cuts `Signature.from`'s memory per call by about 3.5x.
