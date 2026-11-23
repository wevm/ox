---
"ox": patch
---

Fixed `RpcTransport.fromHttp` throwing a raw `SyntaxError` or `TypeError` for a malformed or non-object JSON reply; it now throws `RpcTransport.MalformedResponseError` (or `RpcTransport.HttpError` for a failed response).
