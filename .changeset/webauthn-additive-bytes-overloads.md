---
"ox": minor
---

Added bytes and parsed-metadata input overloads to `webauthn.Authentication.verify`, `webauthn.Authenticator.getSignCount`, and `webauthn.Authenticator.getAuthenticatorData`, exposed `webauthn.Authenticator.parse` plus the `webauthn.Authenticator.AuthenticatorData` type, and added an `as: 'Hex' | 'Bytes'` option to `webauthn.Authentication.getSignPayload`.
