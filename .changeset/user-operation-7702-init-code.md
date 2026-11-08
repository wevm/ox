---
"ox": patch
---

Fixed `UserOperation.toPacked` and `UserOperation.toInitCode` to keep the padded EIP-7702 `0x7702` initCode marker expected by EntryPoint 0.8 and 0.9, using the delegate address only with the new `forHash` option.
