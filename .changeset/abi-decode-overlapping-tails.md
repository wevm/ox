---
"ox": patch
---

Fixed `AbiParameters.decode` to limit the total number of bytes read to 32 times the size of the data plus the repeated-read allowance, and to throw when dynamic values with overlapping data exceed it.
