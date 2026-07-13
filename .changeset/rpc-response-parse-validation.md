---
'ox': patch
---

Fixed `RpcResponse.parse` silently returning `undefined` for malformed payloads -- it now validates the JSON-RPC envelope (`jsonrpc === '2.0'`, presence of `id`, and presence of either `result` or `error`) and throws `RpcResponse.ParseError` otherwise.
