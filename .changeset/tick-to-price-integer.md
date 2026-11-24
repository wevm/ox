---
"ox": patch
---

Fixed `Tick.toPrice` accepting non-integer ticks and returning malformed prices; it now throws `Tick.TickOutOfBoundsError`.
