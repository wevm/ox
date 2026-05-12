---
"ox": patch
---

Extracted shared codec primitives into `src/core/internal/codec/` (`utf8`, `hex`, `int`, `bech32-base32`, `errors`) so leaf modules can depend on a single set of strict, allocation-tight helpers without circular references.
