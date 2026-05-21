---
'ox': patch
---

Fixed `Bytes.fromNumber` and `Rlp.fromHex` rejecting valid odd-nibble hex output produced by `Hex.fromNumber` (e.g. `0x7`, `0x311`); both now even-pad before handing the value to the strict `Bytes.fromHex` parser.
