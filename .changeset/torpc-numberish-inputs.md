---
'ox': minor
---

Widened `toRpc` inputs (and their symmetric zod `*ToRpc` encode schemas) to accept numberish values -- `Hex.Hex | bigint | number` for bigint-typed quantities and `Hex.Hex | number` for number-typed quantities -- while keeping decoded/`fromRpc` output types strictly `bigint`/`number`.
