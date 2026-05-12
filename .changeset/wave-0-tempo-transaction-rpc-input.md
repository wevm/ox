---
"ox": patch
---

Fixed `tempo.Transaction.toRpc` to emit each call's data as `input` to match the `TempoRpc` schema and round-trip with `tempo.Transaction.fromRpc`.
