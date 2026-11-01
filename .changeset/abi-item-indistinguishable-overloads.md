---
"ox": patch
---

Fixed `AbiItem.fromAbi` resolving overloads that the arguments could not distinguish (such as `bytes32` and `bytes`, `uint256` and `int256`, or `uint256[]` and `uint256[2]`) to the last match instead of throwing `AbiItem.AmbiguityError`.
