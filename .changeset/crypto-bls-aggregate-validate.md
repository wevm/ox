---
"ox": patch
---

Fixed `Bls.aggregate` to reject empty arrays and mixed G1/G2 input, and added a fast path that returns the input directly when only one point is supplied.
