---
"ox": patch
---

Stopped requiring an `account` binding on configurable account key grants, so `KeyAuthorization` accepts every grant the Tempo node accepts, and deprecated `KeyAuthorization.MissingAccountError`, which is no longer thrown.
