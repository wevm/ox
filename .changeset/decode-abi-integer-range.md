---
"ox": patch
---

Fixed `AbiParameters.decode` accepting `intN`/`uintN` words outside the declared type's range and `address` words with non-zero padding; it now throws `Hex.IntegerOutOfRangeError` or `Address.InvalidAddressError`, matching Solidity's `abi.decode`.
