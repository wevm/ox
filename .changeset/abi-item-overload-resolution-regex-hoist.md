---
"ox": patch
---

Hoisted the integer/fixed-bytes/array regex literals used during overload resolution to module scope and replaced the `for...in` loop in `getAmbiguousTypes` with an indexed `for` loop, removing per-iteration allocations and inherited-key visits.
