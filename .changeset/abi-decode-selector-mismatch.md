---
"ox": patch
---

Fixed `AbiFunction.decodeData` and `AbiError.decode` to throw `SelectorMismatchError` when the selector in `data` does not match the item or one of its overloads.
