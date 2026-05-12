---
"ox": patch
---

Refactored `webauthn.Registration.serializeResponse` to delegate the response field serialization (including the getter fallback for browsers and passkey providers that expose response fields only via getters) to the shared `serializeResponseFields` helper.
