---
"ox": patch
---

viem/tempo: Renamed `contractAddress` to `address` on `KeyAuthorization.Scope`. Added support for human-readable ABI signatures in `selector` (e.g. `'transfer(address,uint256)'`), which are automatically encoded into 4-byte selectors.
