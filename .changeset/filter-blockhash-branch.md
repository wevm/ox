---
'ox': minor
---

Added the EIP-234 `blockHash` branch to `Filter.Filter` (and `Filter.Rpc`) so log filters can be discriminated against `fromBlock`/`toBlock` and `blockHash`, matching the execution-apis `filter.yaml` `oneOf` schema. `Filter.toRpc` now forwards `blockHash` when present.
