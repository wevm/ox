---
"ox": patch
---

Added `requestsHash` (EIP-7685) to `Block.Block`, `Block.toRpc` and the `Block` zod schemas, so post-Prague blocks no longer lose it on a round trip.
