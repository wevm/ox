---
"ox": patch
---

Added `requestsHash` (EIP-7685) to `Block.Block` and `Block.toRpc`, so post-Prague blocks no longer lose it on a round trip.
