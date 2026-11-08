---
"ox": patch
---

Fixed `CompactSize.toBytes` and `CompactSize.toHex` silently truncating values larger than `2^64 - 1` instead of throwing.
