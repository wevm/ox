---
"ox": patch
---

Hoisted the array-suffix regex used by `getArrayComponents` to module scope so subsequent `getArrayComponents` calls reuse a single cached regex instance.
