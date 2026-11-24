---
"ox": patch
---

Improved type-checking of `Transaction.toRpc` (core and tempo) for settled transactions by about 5x with an overload that skips inferring `pending`.
