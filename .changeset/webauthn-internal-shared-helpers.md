---
"ox": patch
---

Added internal `parseAuthenticatorData` and `serializeResponseFields` helpers under `webauthn/internal/utils.ts` to share authenticator-data parsing and response-field base64url serialization across `Authentication`, `Authenticator`, `Credential`, and `Registration`.
