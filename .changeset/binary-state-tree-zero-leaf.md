---
"ox": patch
---

Fixed `BinaryStateTree.merkelize` hashing a 32-byte zero value as an empty leaf, which did not match EIP-7864.
