---
"ox": patch
---

Improved `Hash.keccak256`, `Hash.sha256`, `Hash.ripemd160`, and `Hash.hmac256` to skip the `Bytes.from` normalization branch when the input is already a `Uint8Array`.
