---
"ox": patch
---

Fixed `TypedData.assert` silently accepting `int`/`uint` (without an explicit bit-width) as a valid EIP-712 type, skipping numeric range validation entirely; it now throws `TypedData.InvalidTypedDataTypeError`.
