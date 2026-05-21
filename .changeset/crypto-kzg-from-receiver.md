---
'ox': patch
---

Fixed `Kzg.from` to preserve `this` binding by wrapping method calls instead of destructuring, so class instances or method-style implementations work correctly.
