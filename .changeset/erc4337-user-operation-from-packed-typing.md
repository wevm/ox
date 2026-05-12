---
"ox": patch
---

Narrowed `UserOperation.fromPacked` return type to `UserOperation<'0.7', true>` to reflect that the packed format does not carry v0.8 `authorization`.
