---
"ox": patch
---

Fixed `TypedData.extractEip712DomainTypes` to include every domain field that is present, so a string `chainId` is hashed instead of left out of the derived domain.
