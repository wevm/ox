---
"ox": patch
---

Cached `AbiItem.getSignatureHash` and the selectors derived from it per ABI item object, which speeds up `AbiEvent.decodeLog` and encoding with plain ABI items, so an item mutated after it was first hashed keeps its first hash until `Caches.clear` runs.
