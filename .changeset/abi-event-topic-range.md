---
"ox": patch
---

Fixed `AbiEvent.encode` accepting out-of-range values for indexed `intN`/`uintN` (N < 256) and wrong-sized `bytesN` (N < 32) arguments instead of throwing.
