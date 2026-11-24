---
"ox": patch
---

Made `Bytes.isEqual` and `Hex.isEqual` compare bytes inline instead of importing `@noble/curves`' `equalBytes`, so importing `ox/Hex` or `ox/Bytes` no longer loads `@noble/curves` and `@noble/hashes` (about 120 kB less heap and 1 ms less CPU per import).
