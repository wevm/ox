---
"ox": patch
---

Added a fast path in `Json.parse` that skips the bigint reviver wrapper when the `#__bigint` sentinel is absent from the input string, letting `JSON.parse` run without a per-key callback.
