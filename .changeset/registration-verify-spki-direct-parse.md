---
"ox": patch
---

Sped up `webauthn.Registration.verify` by parsing the fixed-length P-256 SPKI directly instead of round-tripping through `crypto.subtle.importKey` / `exportKey` for every registration.
