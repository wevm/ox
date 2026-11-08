---
"ox": patch
---

Fixed `AbiItem.fromAbi` throwing `AbiItem.AmbiguityError` for `string` and `bytes` overloads when the argument is a plain string; only hex strings and `Uint8Array` values now match `bytes`.
