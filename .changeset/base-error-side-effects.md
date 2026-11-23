---
"ox": patch
---

Removed the top-level side effects of `Errors.BaseError` (its static initialization block), so bundles no longer keep `BaseError` and a module's unused error classes whenever they import anything from that module. `Errors.BaseError.defaultStaticOptions` is now a getter.
