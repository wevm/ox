---
"ox": patch
---

Changed `Hex.concat` to drop the first two characters of every value, as it already did when given two values, instead of removing the first `0x` found anywhere in each value.
