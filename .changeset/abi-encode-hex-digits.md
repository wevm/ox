---
"ox": patch
---

Made `AbiParameters.encode` and `AbiFunction.encodeData` build their output as a string of hex digits instead of writing a byte buffer and hex-encoding it, and skipped the integer-type regex and bound arithmetic for `uint256` and `int256`. `AbiParameters.encode` runs about 2x faster and `AbiFunction.encodeData` about 2.5x faster; the output and errors are unchanged.
