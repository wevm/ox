---
"ox": patch
---

Fixed `AbiEvent.assertArgs` not matching integer arguments given as a `number` against values decoded as `bigint`, or as a `bigint` against small integers decoded as `number`.
