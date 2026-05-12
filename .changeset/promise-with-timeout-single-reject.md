---
"ox": patch
---

Fixed `RpcTransport.fromHttp` (via internal `withTimeout`) producing an unhandled rejection when the wrapped fetch threw a non-`AbortError` after the timeout setup ran.
