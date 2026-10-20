---
"ox": patch
---

Added `KeyAuthorization.InvalidAdminAuthorizerError`, thrown when an admin key authorization is signed by or grants a configurable account, and made the `KeyAuthorization` zod schemas reject the same grants, since admin access keys are removed at T14 (TIP-1137).
