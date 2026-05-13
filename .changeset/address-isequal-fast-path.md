---
"ox": patch
---

Sped up `Address.isEqual` by replacing per-input regex `assert` calls with a manual ASCII shape check and an identity short-circuit before the case-insensitive compare.
