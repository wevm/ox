---
'ox': patch
---

Cached the `address, bytes, bytes` ABI parameter list at module scope in `SignatureErc6492` so `wrap` and `unwrap` no longer reparse on every call.
