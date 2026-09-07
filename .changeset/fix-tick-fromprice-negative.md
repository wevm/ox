---
"ox": patch
---

Fixed `Tick.fromPrice` silently accepting a negative fractional price (e.g. `"-0.999"`) as its positive counterpart. Negative prices now throw `Tick.PriceOutOfBoundsError`.
