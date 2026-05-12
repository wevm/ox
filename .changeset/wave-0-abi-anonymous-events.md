---
"ox": patch
---

Fixed `AbiEvent.encode` and `AbiEvent.decode` to honor the `anonymous` flag -- anonymous events no longer prepend or expect a selector topic.
