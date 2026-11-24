---
"ox": patch
---

Made `Signature.from`, `Signature.extract` and `Signature.assert` validate 32-byte `r` and `s` with one regex test instead of parsing them as BigInts, `Signature.extract` and `Signature.fromRpc` skip per-call allocations, and `Hex.padLeft`/`Hex.padRight` return a value that already has the size as is, which cuts memory per call by about 7x for `Signature.from`, 5x for `Signature.extract` and 4x for `Signature.fromRpc`.
