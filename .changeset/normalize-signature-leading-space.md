---
"ox": patch
---

Fixed `AbiItem.getSignature` (and `AbiFunction.getSelector`, `AbiEvent.getSelector`) dropping the first parameter when a space directly follows an opening parenthesis.
