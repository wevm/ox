---
"ox": patch
---

Fixed `RpcResponse.from` crashing when called without a `request` option and missing `jsonrpc` -- it now validates the envelope and throws `RpcResponse.ParseError` for missing `id`/`jsonrpc`.
