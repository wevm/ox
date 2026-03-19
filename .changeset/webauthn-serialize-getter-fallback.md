---
"ox": patch
---

Fixed WebAuthn response serialization to fall back to getter methods (e.g. `getAuthenticatorData()`) when properties are not directly accessible on the response object. Some browsers and passkey providers (e.g. 1Password, Firefox) proxy the credential object, making property access return `undefined` even though the data is available via getter methods.
