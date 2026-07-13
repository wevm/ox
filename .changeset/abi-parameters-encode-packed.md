---
'ox': patch
---

Fixed `AbiParameters.encodePacked` to validate that fixed-array lengths match the supplied value, throwing `ArrayLengthMismatchError` (e.g. for `uint256[2]` with three elements) instead of silently encoding the wrong arity.
