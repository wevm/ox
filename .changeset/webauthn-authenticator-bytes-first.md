---
"ox": minor
---

Added an `as: 'Hex' | 'Bytes'` option to `webauthn.Authenticator.getAuthenticatorData`. The bytes path assembles into a single `Uint8Array` directly, while the legacy hex path stays in hex throughout to avoid `Bytes <-> Hex` round trips. `getSignCount` now accepts `Hex` or `Uint8Array`, eliminating the unconditional `Bytes.fromHex` decode for byte-input callers.
