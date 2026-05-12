---
'ox': patch
---

Sped up `RpcResponse.from` by skipping the spread-copy when the response already carries `id` and `jsonrpc`, only allocating a new object on the field-patching paths.
