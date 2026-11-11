---
"ox": patch
---

Fixed `AbiEvent.decode`, `AbiEvent.decodeLog` and `AbiEvent.extractLogs` to reject indexed `address`, `bool`, `intN` and `uintN` topics that are not canonical 32-byte ABI words, as `AbiParameters.decode` does.
