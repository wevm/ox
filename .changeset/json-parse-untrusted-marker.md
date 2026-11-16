---
"ox": patch
---

Fixed `Json.parse` to keep a string that ends in `#__bigint` but is not a bigint as a string instead of throwing.
