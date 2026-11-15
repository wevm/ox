---
"ox": patch
---

Fixed `AbiParameters.encodePacked` to throw `Hex.InvalidLengthError` for `bytes` hex values with an odd number of digits instead of returning misaligned data.
