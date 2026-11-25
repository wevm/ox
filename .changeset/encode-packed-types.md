---
"ox": minor
---

Improved type-checking of `AbiParameters.encodePacked` by about 8x (106,000 to 13,000 instantiations for a call) by constraining `types` to `readonly unknown[]` instead of a union that includes `PackedAbiType[]`. Values are still typed from the types, but `types` no longer autocompletes.
