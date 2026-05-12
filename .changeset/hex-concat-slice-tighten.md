---
"ox": patch
---

Tightened `Hex.concat` and `Hex.slice` to avoid `String.replace('0x', '')` work on every argument and to skip the per-argument reducer allocation.
