---
"ox": patch
---

Made `Bytes.isEqual` and `Hex.isEqual` compare bytes themselves instead of importing `@noble/curves`' utilities, so `ox/Bytes` and `ox/Hex` load faster; the result and errors are unchanged.
