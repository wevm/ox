---
"ox": patch
---

Fixed `AbiParameters.decode` to throw when the 32-byte slot of a fixed-size `bytesN` value is cut short, as it does for other static types.
