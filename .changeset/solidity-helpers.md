---
'ox': minor
---

Added `Solidity.intRange(bits, signed)` and `Solidity.maxUint(bits)` helpers that compute the inclusive range or maximum unsigned value of a Solidity integer of the given bit width without importing one of the `Solidity.maxInt*`/`Solidity.maxUint*` constants by name.
