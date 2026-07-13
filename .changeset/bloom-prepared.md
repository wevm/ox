---
'ox': minor
---

Added `Bloom.prepare`, `Bloom.containsPrepared`, and `Bloom.containsHash` for membership checks against a precomputed bloom filter. Use `Bloom.prepare(bloom)` once and `Bloom.containsPrepared(prepared, input)` (or `Bloom.containsHash(prepared, hash)` when the caller already has the keccak hash) inside hot loops to avoid the per-call `Bytes.fromHex` allocation that `Bloom.contains` pays.
