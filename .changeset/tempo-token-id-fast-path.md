---
"ox": patch
---

Rewrote `TokenId.compute` to hash the ABI-equivalent `(address, bytes32)` layout directly instead of round-tripping through `AbiParameters.encode`, and gave `TokenId.fromAddress` a TIP-20 prefix fast path that skips a redundant `.toLowerCase()` on already-lowercase inputs.
