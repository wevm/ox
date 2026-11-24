---
"ox": patch
---

Wrote the `Solidity` integer bounds, `AccountConfig.zeroSalt` and an internal `Siwe` regex out as literals, so bundlers drop `ox/Solidity`, `ox/Siwe` and `ox/tempo/AccountConfig` when they are unused, and bundles that import `Solidity` no longer keep its 96 bounds.
