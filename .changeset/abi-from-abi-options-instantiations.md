---
"ox": patch
---

Reduced the type instantiations of `AbiItem.fromAbi`, `AbiFunction.fromAbi`, `AbiEvent.fromAbi` and `AbiError.fromAbi` (about 2.2×): `fromAbi.Options` declares `prepare` in each of its branches instead of intersecting it with them.
