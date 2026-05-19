---
"ox": patch
---

Fixed `AbiConstructor.decode` to assert that `data` begins with the provided `bytecode` and allowed constructor encoding and decoding without an ABI constructor when no arguments are present.
