---
"ox": patch
---

Fixed `UserOperation.toPacked` to keep the EIP-7702 `0x7702` marker (padded to 20 bytes) in `initCode`, as EntryPoint 0.8 and 0.9 expect, instead of replacing it with the delegate address. The delegate is now only used for hashing, through the new `forHash` option of `UserOperation.toInitCode` (passed on by `toPacked` and `hash`).
