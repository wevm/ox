---
"ox": patch
---

Fixed `RpcResponse.parseError` re-wrapping existing `RpcResponse.BaseError` instances as `InternalError` -- existing instances are now returned as-is.
