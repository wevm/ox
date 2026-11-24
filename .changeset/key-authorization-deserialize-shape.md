---
"ox": patch
---

Fixed `KeyAuthorization.deserialize` throwing a `TypeError` or `SyntaxError` for RLP that is not shaped like a key authorization; it now throws `KeyAuthorization.InvalidSerializedError`.
