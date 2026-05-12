---
"ox": patch
---

Fixed `webauthn.Authentication.verify` to reject assertion `authenticatorData` whose flags imply structure not allowed for assertions: the `AT` (attested credential data) bit is now refused, and an `ED` (extension data) bit must be backed by a CBOR-decodable trailing extension map.
