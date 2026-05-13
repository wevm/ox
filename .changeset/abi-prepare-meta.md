---
"ox": minor
---

Added `Abi.from({ prepare: true })` and a per-parameter `_meta` cache that lets prepared `AbiParameters.encode` / `decode` skip regex parses, applies a strict `minStaticHeadSize` decode preflight, opts fully-static trees out of cursor recursive-read bookkeeping, memoizes `AbiItem.fromAbi` selector lookups, and caches the no-arg `AbiEvent.encode` topics array.
