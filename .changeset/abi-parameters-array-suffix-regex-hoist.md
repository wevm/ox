---
"ox": patch
---

Sped up `AbiParameters.encode`, `AbiParameters.decode`, and `AbiParameters.format` array handling by reusing a single cached array-suffix regex across calls instead of recompiling per parameter.
