---
"ox": patch
---

Optimised `AbiItem.fromAbi` selector lookups to use `Array.prototype.find` (short-circuiting on the first match) instead of `Array.prototype.filter`, and cached the 4-byte slice once per call so each candidate's `getSelector` is compared against a precomputed value.
