---
"ox": patch
---

Fixed `RpcTransport.fromHttp` to reject with `Promise.TimeoutError` when the timeout elapses even if a custom `fetchFn` ignores the abort signal.
