---
"ox": patch
---

Refactored `webauthn.Authentication.verify` and `Authentication.serializeResponse` to consume the shared `parseAuthenticatorData` and `serializeResponseFields` internal helpers, removing duplicated bit-twiddling and getter-fallback boilerplate.
