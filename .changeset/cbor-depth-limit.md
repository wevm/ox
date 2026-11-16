---
"ox": patch
---

Fixed `Cbor.decode` to throw `Cbor.DepthLimitExceededError` when values nest deeper than 1024 instead of overflowing the stack.
