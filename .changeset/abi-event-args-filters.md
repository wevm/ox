---
"ox": patch
---

Fixed `AbiEvent.assertArgs` and `AbiEvent.extractLogs` `args` filters not matching non-indexed `string` and `bytes` values, data-decoded indexed values in non-strict mode, or `bytes` values in a different hex case.
