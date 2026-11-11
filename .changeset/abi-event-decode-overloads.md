---
"ox": patch
---

Fixed `AbiEvent.decode` to resolve overloaded events by the selector in `topics[0]` instead of always decoding with the overload picked by name.
