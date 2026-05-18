---
"ox": patch
---

Fixed `webauthn.Authentication.sign` to decode `clientDataJSON` bytes as UTF-8 via `Bytes.toString` instead of `String.fromCharCode(...bytes)`, which corrupted non-ASCII payloads and could throw `RangeError` on large inputs.
