---
"ox": patch
---

Made `AbiItem.fromAbi` (and the `fromAbi` of `AbiFunction`, `AbiEvent`, `AbiError`) find a uniquely named item without collecting matches into an array, which cuts the memory a lookup allocates by about 4x.
