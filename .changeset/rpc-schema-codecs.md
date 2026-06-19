---
'ox': minor
---

Added directional codec helpers to the `ox/zod` `RpcSchema` namespace: `decodeParams`/`encodeParams`, `decodeReturns`/`encodeReturns`, and `decodeRequest`/`encodeRequest` (`decode` maps wire → native, `encode` maps native → wire), alongside `parseItem` for method lookup and `parse` as an alias of `decodeRequest`. Scalar quantity returns in `z.RpcSchema.Eth` now decode to their native representation (`eth_blockNumber`, `eth_gasPrice`, `eth_blobBaseFee`, `eth_estimateGas`, `eth_getBalance`, `eth_maxPriorityFeePerGas` → `bigint`; `eth_chainId`, `eth_getTransactionCount`, `eth_getBlockTransactionCountBy*`, `eth_getUncleCountByBlock*` → `number`), while raw transport typing (`RpcSchema.FromZod`) continues to use wire types.
