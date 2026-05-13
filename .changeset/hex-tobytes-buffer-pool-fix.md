---
"ox": patch
---

Fixed `Hex.toBytes` and `Bytes.fromHex` returning a `Uint8Array` view that aliased Node's shared `Buffer` pool memory, which broke callers that read `.buffer` (e.g. WebAuthn `attestationObject` round-trips).
