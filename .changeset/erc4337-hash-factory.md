---
"ox": patch
---

Fixed `UserOperation.hash` for EntryPoint 0.7 in `ox/erc4337` to hash the same `initCode` as `UserOperation.toPacked`, so a `factory` without `factoryData` is included in the hash.
