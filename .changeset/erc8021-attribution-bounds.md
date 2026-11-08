---
"ox": patch
---

Fixed `Attribution.fromData` to return `undefined` when a codes or CBOR length field claims more bytes than precede it.
