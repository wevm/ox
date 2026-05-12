---
"ox": patch
---

Fixed `UserOperation.fromRpc` and `UserOperation.toRpc` to parse and serialize the v0.8 `authorization` field instead of dropping it.
