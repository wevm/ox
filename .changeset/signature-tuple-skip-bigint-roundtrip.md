---
"ox": patch
---

Rewrote `Signature.fromTuple` and `Signature.toTuple` to bypass the polymorphic `Signature.from` constructor and the `Hex.fromNumber` + `Hex.trimLeft` round-trip used on every TxEnvelope encode/decode.
