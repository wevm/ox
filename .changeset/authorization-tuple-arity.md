---
"ox": patch
---

Fixed `Authorization.fromTuple` to throw `Authorization.InvalidError` unless the tuple has three or six elements, and `TxEnvelopeEip7702.deserialize` to require six-element authorization tuples.
