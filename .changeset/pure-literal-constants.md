---
"ox": patch
---

Wrote the `Solidity` integer bounds, `AccountConfig.zeroSalt`, and the internal `PersonalMessage` and `Siwe` constants out as literals, so bundlers drop `ox/Solidity`, `ox/Siwe`, `ox/PersonalMessage` and `ox/tempo/AccountConfig` when they are unused.
