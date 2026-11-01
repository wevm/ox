---
"ox": patch
---

Fixed `AbiItem.fromAbi` resolving indistinguishable overloads, such as `bytes32` and `bytes`, `uint256` and `int256`, or `uint256[]` and `uint256[2]`, to the last match. It now throws `AbiItem.AmbiguityError`, and a selector selects the overload. An overload matches only an integer in its range or fixed bytes of its size.
