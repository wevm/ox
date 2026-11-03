---
"ox": patch
---

Fixed `Cbor.decode` to decode a `__proto__` map key as an own property instead of replacing the prototype of the decoded object.
