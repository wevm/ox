---
'ox': minor
---

The `ox/zod` `RpcSchema` codecs (`decodeParams`/`encodeParams`, `decodeReturns`/`encodeReturns`) now also accept a resolved `RpcSchema.Item` in place of a `(namespace, method)` pair. A method can be looked up once with `z.RpcSchema.parseItem` and passed to each codec, so encoding params and decoding returns no longer repeats the namespace and method name.
