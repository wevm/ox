---
"ox": patch
---

fix: handle bigint chainId in TypedData.extractEip712DomainTypes

The `extractEip712DomainTypes` function now correctly handles both number and bigint types for
the `chainId` field in the EIP-712 domain.
