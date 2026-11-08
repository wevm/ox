---
"ox": patch
---

Fixed `RpcTransport.fromHttp` dropping `fetchOptions.headers` supplied as a `Headers` instance or tuple array, and sending both the default and the caller's `Content-Type` when only their casing differed.
