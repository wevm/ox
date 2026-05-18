---
"ox": patch
---

Fixed `AbiFunction.decodeData` to throw `AbiParameters.DataSizeTooSmallError` when the calldata is exactly the 4-byte selector but the function declares inputs, instead of silently returning `undefined`.
