---
"ox": patch
---

Reduced the type instantiations of ABI encoding calls with inline values, such as `AbiParameters.encodePacked` (about 120×), `AbiFunction.encodeResult` (about 50×), and `AbiParameters.encode`, `AbiFunction.encodeData`, `AbiError.encode`, `AbiConstructor.encode` and `AbiEvent.encode` (about 5×).
