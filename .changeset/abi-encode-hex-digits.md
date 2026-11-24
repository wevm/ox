---
"ox": patch
---

Made `AbiParameters.encode` build its output as one string of hex digits, instead of creating, slicing and concatenating a `0x` string per word. `AbiParameters.encode` runs about 4x faster with a quarter of the memory, and `AbiFunction.encodeData` about 3x faster; the output and errors are unchanged.
