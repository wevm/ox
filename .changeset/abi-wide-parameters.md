---
"ox": patch
---

Reduced the type instantiations of the ABI modules' generic signatures. Wide parameters (`readonly AbiParameter[]`) now resolve to `readonly unknown[]` without mapping every ABI type, and `AbiItem.fromAbi.Options` puts `prepare` in each of its branches instead of intersecting it with them. `Parameters<typeof AbiFunction.encodeData>` drops from about 10,800 instantiations to 500, `AbiParameters.encode` from 10,600 to 300, and `AbiFunction.fromAbi` and `AbiItem.fromAbi` from about 14,600 to 2,100. The types are unchanged.
