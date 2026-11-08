---
"ox": patch
---

Fixed `AbiEvent.assertArgs` and `AbiEvent.extractLogs` not matching integer arguments given as a `number` against values decoded as `bigint`, or as a `bigint` against small integers decoded as `number`.
