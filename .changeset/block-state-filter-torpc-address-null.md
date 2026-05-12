---
"ox": patch
---

Made `Filter.toRpc` preserve explicit `address: null` (and `topics: null`) instead of stripping it via truthy checks.
