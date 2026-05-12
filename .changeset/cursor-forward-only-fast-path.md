---
"ox": patch
---

Sped up `AbiParameters.decode`, `AbiFunction.decodeData`, `AbiError.decode`, and `AbiEvent.decode` on monotonically-forward reads (the dominant ABI decode pattern), eliminating per-read bookkeeping that previously ran on every cursor advance.
