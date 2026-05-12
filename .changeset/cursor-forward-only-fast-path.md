---
"ox": patch
---

Added a forward-only fast path to the internal `Cursor` `_touch` bookkeeping so monotonic reads (the dominant ABI decode pattern) skip the per-read `Map` get/set used to enforce the recursive-read limit.
