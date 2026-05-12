---
"ox": patch
---

Fixed `RpcTransport.fromHttp` ignoring its own `timeout` when the caller supplied a `fetchOptions.signal`; both signals are now composed via `AbortSignal.any` so the timeout always fires.
