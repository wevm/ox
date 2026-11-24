---
"ox": patch
---

Fixed `Json.canonicalize` writing invalid JSON for `undefined`, functions and symbols in arrays and objects, and ignoring `toJSON` (e.g. for a `Date`); it now follows `JSON.stringify`.
