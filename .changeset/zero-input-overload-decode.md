---
"ox": patch
---

Fixed `AbiFunction.decodeData` returning `undefined` when a function name has a zero-input overload and the calldata targets another overload, by keeping the other overloads on items `fromAbi` resolves without `args`.
