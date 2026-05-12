---
"ox": patch
---

Rewrote the COSE key path in `webauthn.Registration.verify` to do exactly one CBOR decode and zero re-encodes. Now uses `CoseKey.toPublicKey(coseKeyBytes, { returnByteLength: true })` to obtain the public key and the consumed COSE byte length in a single pass, replacing the prior `bytes -> hex -> CBOR decode -> re-encode -> length compare` chain that mis-rejected valid COSE keys with optional members.
