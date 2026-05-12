---
"ox": patch
---

Fixed `AbiParameters.encodePacked` to validate fixed-array lengths and to right-pad `string[]` and `bytes[]` elements to a 32-byte boundary, matching the Solidity packed-encoding specification.
