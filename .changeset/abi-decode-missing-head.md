---
"ox": patch
---

Fixed `AbiParameters.decode` to throw `AbiParameters.DataSizeTooSmallError` when a static parameter head after a dynamic parameter is missing, instead of reading an earlier word as its value.
