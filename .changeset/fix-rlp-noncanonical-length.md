---
"ox": patch
---

Fixed the RLP decoder silently accepting non-canonical alternate encodings (a single byte < 0x80 wrapped in an unnecessary length prefix, or a length using more length-bytes than the minimal required form), which allowed distinct byte strings to decode to the same value. Non-canonical encodings now throw `Rlp.NonCanonicalError`.
