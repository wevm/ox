---
"ox": patch
---

Wrote the ABI parameters behind `SignatureErc6492.wrap`/`unwrap`, `Execute` batch-of-batches encoding and decoding, and `Calls.encode`/`decode`/`getAbiParameters` out as JSON, so using them no longer bundles the human-readable ABI parser.
