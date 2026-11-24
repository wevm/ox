---
"ox": patch
---

Made `z.RpcSchema` tree-shakeable, so importing its codecs, `from` or errors no longer bundles every `eth_` and `wallet_` schema.
