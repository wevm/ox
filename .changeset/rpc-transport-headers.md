---
"ox": patch
---

Fixed `RpcTransport.fromHttp` sending both the default and the caller's `Content-Type` when `fetchOptions.headers` set it, instead of the caller's value alone.
