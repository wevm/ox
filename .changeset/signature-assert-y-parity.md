---
"ox": patch
---

Fixed `Signature.assert` to reject a `yParity` that is not exactly `0` or `1`, and `Signature.toTuple` to throw on an invalid or missing `yParity` instead of encoding it by truthiness.
