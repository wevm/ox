---
'ox': minor
---

Added Zod-backed RPC schema support: `z.RpcSchema.from` (in `ox/zod`) now accepts a record of `{ params, returns }` Zod schemas keyed by method name and returns a parseable `RpcSchema.Namespace`; `RpcSchema.Schema`/`RpcSchema.ToGeneric`/`RpcSchema.FromZod` were added; and `Provider.from` / `RpcTransport.fromHttp` accept a Zod namespace as their `schema` option, deriving request/return types from it.
