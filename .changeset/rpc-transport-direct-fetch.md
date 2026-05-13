---
'ox': patch
---

Sped up `RpcTransport.fromHttp` by passing the URL and `init` directly to `fetchFn` instead of allocating an intermediate `Request` object on every call, and by skipping the timeout `AbortController` and outer `Promise` wrapper when no positive timeout was configured.
