---
"ox": patch
---

Fixed `Authentication.verify` throwing a `SyntaxError` for malformed `clientDataJSON` instead of returning `false`, and `Registration.verify` throwing it instead of a `Registration.VerifyError`.
