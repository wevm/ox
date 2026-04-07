---
"ox": patch
---

Fixed `Credential.serialize` to extract `authenticatorData` from the CBOR-encoded `attestationObject` when the browser/passkey provider doesn't expose it on the response object (e.g. Firefox + 1Password).
