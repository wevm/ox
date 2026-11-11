---
"ox": patch
---

Fixed `Execute.decodeData` and `Execute.decodeBatchOfBatchesData` in `ox/erc7821` to decode only calldata in their own execution modes and throw `Execute.UnsupportedModeError` for any other mode.
