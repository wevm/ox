---
"ox": patch
---

Fixed `Transaction.toRpc` (in `ox/tempo`) dropping `nonceKey`, so serialized Tempo transactions keep their 2D nonce lane.
