---
"ox": patch
---

Fixed `webauthn.Authentication.getSignPayload` to honor the documented `hash` option by SHA-256 hashing the returned payload when `hash: true` is passed.
