---
"ox": patch
---

Reduced the type instantiations of `AbiFunction.encodeData` calls: a function without inputs is recognized without resolving its parameter types (72 → 43 for a call without arguments).
