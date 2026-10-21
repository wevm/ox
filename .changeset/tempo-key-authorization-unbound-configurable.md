---
"ox": patch
---

Stopped requiring an `account` binding on configurable account key grants, so `KeyAuthorization` and its zod schemas accept every grant the Tempo node accepts, and deprecated `KeyAuthorization.MissingAccountError`, which is no longer thrown.
