---
"ox": patch
---

Fixed `TypedData.assert` and `TypedData.validate` accepting invalid struct names (such as `uint7` or `Foo.Bar`) and invalid field types (such as `uint`, `bytes0`, or an undefined struct), which now throw `TypedData.InvalidStructTypeError` and the added `TypedData.InvalidTypeError`.
