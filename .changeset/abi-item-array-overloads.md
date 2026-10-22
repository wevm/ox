---
"ox": patch
---

Fixed `AbiItem.fromAbi` not matching array arguments whose element type has a `0` in its size (e.g. `uint160[]`, `bytes20[]`, `int40[2]`), which made overload resolution fall back to the wrong item. Array overloads with ambiguous element types, such as `address[]` and `bytes20[]`, now throw `AbiItem.AmbiguityError` like `address` and `bytes20` do.
