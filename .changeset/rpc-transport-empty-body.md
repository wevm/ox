---
'ox': patch
---

Fixed `RpcTransport.fromHttp` to throw `RpcTransport.MalformedResponseError` for empty `2xx` HTTP bodies instead of silently returning `undefined`.
