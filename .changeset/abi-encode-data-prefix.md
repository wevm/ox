---
"ox": patch
---

Made `AbiFunction.encodeData` faster and leaner: it writes the parameters' encoding straight after the selector instead of slicing and copying a `0x`-prefixed encoding, `AbiItem.getSelector` and `AbiItem.getSignatureHash` no longer allocate a closure and an arguments array per call, and the ABI encoder sizes its list of parameters up front. `encodeData` of an `(address, uint256)` call goes from about 300 to 170 ns and from 1.1 kB to 360 B allocated.
