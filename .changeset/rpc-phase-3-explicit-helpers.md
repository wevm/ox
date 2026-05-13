---
"ox": minor
---

Added `RpcRequest.build`, `RpcResponse.envelope`, `RpcResponse.parseResult`, and `RpcResponse.parseEnvelope` as explicit-name companions to the broader `from` / `parse` helpers, plus schema-first generic overloads for `Provider.from<MySchema>(provider)` and `RpcTransport.fromHttp<MySchema>(url)`; `RpcSchema.from()` and the broad `from` / `parse` aliases are now `@deprecated` in JSDoc but continue to work as compatibility wrappers.
