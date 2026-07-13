---
'ox': patch
---

Fixed `RpcTransport.fromHttp` to surface an `HttpError` (instead of a `SyntaxError`) when servers return `Content-Type: application/json` with an empty body for non-`2xx` responses.
