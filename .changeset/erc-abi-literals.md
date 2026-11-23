---
"ox": patch
---

Wrote the ABI parameters that `SignatureErc6492.wrap`/`unwrap`, `Execute` batch-of-batches encoding and decoding, `Calls.encode`/`decode`/`getAbiParameters` and `TokenId.compute` used out as JSON instead of parsing human-readable ABI on every call. `Calls.getAbiParameters` now also declares its real return type (a `tuple[]` with its components, and `opData` when requested) instead of `[{ type: 'Call[]' }]`.
