---
"ox": patch
---

Fixed `Attribution.fromData` (ERC-8021) accepting malformed suffixes whose `codesLength` or `cborLength` field exceeds the available data. Such inputs now return `undefined` instead of silently mis-parsing or throwing.
