---
"ox": patch
---

Added `Cbor.DepthLimitExceededError`, which `Cbor.decode` throws for values nested more than 1024 levels deep instead of overflowing the stack.
