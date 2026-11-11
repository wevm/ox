---
"ox": patch
---

Fixed `KeyAuthorization.from`, `toTuple`, and `toRpc` (and the `ox/zod/tempo` `Scope` schema) to reject a scope with `recipients` and no `selector`.
