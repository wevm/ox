---
"ox": patch
---

Made `Signature.toHex` about 2.5x faster with a quarter of the memory, and `Signature.toRpc`, `Signature.fromHex` and `Signature.fromRpc` slightly faster, by writing and reading `r` and `s` as hex words directly.
