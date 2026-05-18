---
"ox": patch
---

Fixed `tempo.AuthorizationTempo.from` to normalize `options.signature` through `SignatureEnvelope.from` so serialized or convenience-shape signatures are accepted as documented.
