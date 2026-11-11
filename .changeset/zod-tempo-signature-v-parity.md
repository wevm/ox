---
"ox": patch
---

Fixed `ox/zod/tempo` `SignatureEnvelope` to derive `yParity` from `v` values above `Number.MAX_SAFE_INTEGER` exactly and to reject a secp256k1 RPC signature that has neither `yParity` nor a supported `v`.
