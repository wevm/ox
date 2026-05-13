---
"ox": patch
---

Replaced the `Array.reduce` accumulator inside `Bls.aggregate` with a tight `for` loop that hoists the noble Point constructor reference.
