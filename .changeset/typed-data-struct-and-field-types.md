---
"ox": patch
---

Fixed `TypedData.assert` and `TypedData.validate` accepting invalid struct names, such as `uint7`, `bytes32` or `Foo.Bar`, and invalid field types, such as `uint`, `uint7`, `bytes0` or an undefined struct, including in structs referenced only as array elements. They now throw `TypedData.InvalidStructTypeError` and the new `TypedData.InvalidTypeError`. `TypedData.encodeType` now includes struct names that contain `$`.
