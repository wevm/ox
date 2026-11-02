---
"ox": patch
---

Fixed `AbiEvent.decode` and `AbiEvent.encode` for anonymous events: `decode` no longer expects a selector topic and reads every topic as an indexed input, and `encode` no longer prepends the selector.
