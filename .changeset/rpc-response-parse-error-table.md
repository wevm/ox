---
'ox': patch
---

Replaced the `RpcResponse.parseError` `if` ladder with a code, constructor lookup table so dispatch is O(1) instead of linear in the number of known JSON-RPC error codes.
