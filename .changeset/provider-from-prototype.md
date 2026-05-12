---
"ox": patch
---

Fixed `Provider.from` to preserve wrapped providers' prototype methods, accessors, and non-enumerable property descriptors instead of dropping them via object spread.
