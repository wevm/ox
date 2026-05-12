---
"ox": patch
---

Fixed `AbiEvent.assertArgs` and `AbiEvent.encode` to always hash `string`/`bytes` indexed inputs to hex via `Hash.keccak256(value, { as: 'Hex' })`, so topic comparisons and emitted topics are reliably hex regardless of whether the input is a `Hex.Hex` or a `Bytes.Bytes`.
