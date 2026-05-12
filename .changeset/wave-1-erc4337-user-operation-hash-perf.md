---
'ox': patch
---

Hoisted `UserOperation.hash` ABI parameter descriptors to module scope, added a shared `packUint128Pair` helper for v0.7+ gas-limit packing, and reused a precomputed empty-bytes keccak for empty `initCode`/`paymasterAndData`.
