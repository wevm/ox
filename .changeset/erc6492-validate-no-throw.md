---
"ox": patch
---

Improved `SignatureErc6492.validate` performance: it checks the magic suffix directly instead of catching the error `assert` throws, so an invalid signature returns `false` about 100× faster and the function no longer bundles the error classes.
