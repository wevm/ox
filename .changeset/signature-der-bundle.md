---
"ox": patch
---

Made `Signature.fromDerHex`, `Signature.fromDerBytes`, `Signature.toDerHex` and `Signature.toDerBytes` encode and decode DER without bundling the secp256k1 curve, with the same range checks and errors.
