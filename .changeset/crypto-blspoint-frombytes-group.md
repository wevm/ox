---
'ox': patch
---

Fixed `BlsPoint.fromBytes` to honor its declared `group` argument and assert the input length matches the requested G1 (48 bytes) or G2 (96 bytes) shape.
