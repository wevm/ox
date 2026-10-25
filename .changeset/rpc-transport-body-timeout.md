---
"ox": patch
---

Fixed `RpcTransport.fromHttp` not applying `timeout` to reading the response body, or when `fetchOptions.signal` was set.
