---
"ox": patch
---

Sped up `Address.assert` and `Address.validate` by replacing the regex / try-catch path with a single manual ASCII pass that classifies shape and lowercase status together; invalid `Address.validate` calls are now ~70x to ~250x faster.
