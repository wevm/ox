---
"ox": patch
---

Improved validation performance in `Hex.assert`, `Value`, `TypedData`, `Siwe.isUri`, ABI overload resolution, and the `ox/zod` hex, address, quantity, and Solidity type schemas by reusing module-level regular expressions instead of recreating them on every call.
