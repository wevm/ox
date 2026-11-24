---
"ox": patch
---

Made `Signature.from`, `Signature.extract` and `Signature.assert` allocate less: `assert` no longer creates a default options object per call and `from` no longer creates a closure. `Signature.extract` of an RPC signature goes from 240 to 144 B allocated.
