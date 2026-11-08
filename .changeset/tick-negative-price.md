---
"ox": patch
---

Fixed `Tick.fromPrice` accepting negative prices between -1 and 0 as their positive counterparts instead of throwing `Tick.PriceOutOfBoundsError`.
