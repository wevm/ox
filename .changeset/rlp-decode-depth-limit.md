---
'ox': patch
---

Added a decode depth limit (1024) to `Rlp.toBytes` / `Rlp.toHex`, throwing `Rlp.DepthLimitExceededError` instead of overflowing the call stack on deeply nested untrusted RLP input.
