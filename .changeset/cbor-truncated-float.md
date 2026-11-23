---
"ox": patch
---

Fixed `Cbor.decode` throwing a `RangeError` instead of `Cursor.PositionOutOfBoundsError` on a truncated float.
