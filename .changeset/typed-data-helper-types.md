---
"ox": patch
---

Improved type-checking of `TypedData.encodeType`, `hashStruct`, `hashType`, `encodeData`, `encodeField` and `findTypeDependencies` by about 700x (11,700 to 17 instantiations for a call): their `types` parameter is a plain record of `{ name, type }` lists instead of abitype's `TypedData`.
