---
'ox': patch
---

Fixed `AbiParameters.decode` to surface a `DataSizeTooSmallError` (with parameter context) instead of leaking a `Cursor.PositionOutOfBoundsError` when the encoded payload is shorter than the parameter list requires.
