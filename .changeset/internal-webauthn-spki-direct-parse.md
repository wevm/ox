---
"ox": patch
---

Replaced the `crypto.subtle.importKey` / `exportKey` round trip in `parseCredentialPublicKey` with direct SPKI parsing for the fixed 91-byte P-256 public key, eliminating two async WebCrypto calls from the registration hot path.
