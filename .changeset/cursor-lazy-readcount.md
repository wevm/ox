---
"ox": patch
---

Sped up `Rlp.toBytes` and `Rlp.toHex` by skipping per-instance read-tracking allocation when the recursive read limit is unbounded.
