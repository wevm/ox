---
"ox": patch
---

Improved validation performance in `Hex.assert`, `Value`, `TypedData`, `Siwe.isUri`, and ABI overload resolution by reusing module-level regular expressions instead of recreating them on every call.
