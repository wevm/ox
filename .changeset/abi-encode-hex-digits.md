---
"ox": patch
---

Made `AbiParameters.encode` and `AbiFunction.encodeData` build their output as a string of hex digits instead of writing a byte buffer and hex-encoding it, skipped the integer-type regex and bound arithmetic for `uint256` and `int256`, lowercased addresses with the native `toLowerCase`, and had `AbiFunction.encodeData`, `AbiItem.getSelector`, `AbiItem.getSignature` and `AbiItem.getSignatureHash` take their arguments without a rest array and closure, so `AbiParameters.encode` runs about 4x faster, `AbiFunction.encodeData` about 4x faster with 4x less memory, and `AbiItem.getSelector` about 7x faster with 12x less memory, with the output and errors unchanged.
