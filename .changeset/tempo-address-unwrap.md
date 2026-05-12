---
"ox": patch
---

Added an internal `TempoAddress.unwrap` fast-path helper that strips a `tempox` prefix and validates the remaining hex without running EIP-55 checksum or allocating a `{ address }` wrapper.
