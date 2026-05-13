---
"ox": patch
---

Replaced the `Hex.concat`-based registration hash path in `VirtualMaster.getRegistrationHash` and `VirtualMaster.validateSalt` with a single 52-byte buffer keccak, and routed master-address resolution through `TempoAddress.unwrap`.
