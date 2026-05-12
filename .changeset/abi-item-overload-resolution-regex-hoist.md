---
"ox": patch
---

Sped up `AbiItem.fromAbi` overload resolution by removing per-call regex compilation and per-iteration allocations from the integer / fixed-bytes / array argument-type comparison.
