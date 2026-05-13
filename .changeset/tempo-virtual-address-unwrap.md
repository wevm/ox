---
"ox": patch
---

Resolved virtual addresses through the new `TempoAddress.unwrap` fast path so `VirtualAddress.parse` skips redundant EIP-55 checksum work for `tempox`-prefixed inputs.
