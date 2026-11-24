---
"ox": patch
---

Fixed `Cbor.decode` throwing a `RangeError` for a truncated 32-bit or 64-bit float instead of `Cursor.PositionOutOfBoundsError`.
