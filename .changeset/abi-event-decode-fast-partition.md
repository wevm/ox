---
"ox": patch
---

Fixed `AbiEvent.decode` to partition `indexed` and non-`indexed` inputs in a single pass and to look up each non-indexed input's original position via a precomputed index map instead of `inputs.indexOf(...)`.
