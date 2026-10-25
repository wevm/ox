---
"ox": patch
---

Fixed `RpcTransport.fromHttp` throwing when `fetchOptions.signal` is set on runtimes without `AbortSignal.any`.
