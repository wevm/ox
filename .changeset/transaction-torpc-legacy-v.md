---
"ox": patch
---

Fixed `Transaction.toRpc` to encode a legacy transaction's `v` without the one-byte limit, so EIP-155 transactions whose `v` is above 255 (chain IDs from 110) no longer throw `Hex.IntegerOutOfRangeError`.
