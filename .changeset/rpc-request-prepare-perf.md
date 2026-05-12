---
'ox': patch
---

Sped up `RpcRequest.createStore` by building requests in a single object literal and added a prepared-request fast path inside the internal RPC transport so already-built `id`/`jsonrpc` envelopes are forwarded without re-allocating.
