---
"ox": patch
---

Changed `Address.assert` and `Address.validate` to reject values that are not strings. Before, `strict: false` coerced them to strings, and strict mode threw a `TypeError` from `assert`.
