---
"ox": patch
---

Fixed `KeyAuthorization` encoding to keep absent `limits` (unlimited) distinct from an empty `limits` list (deny-all), matching the Tempo node.
