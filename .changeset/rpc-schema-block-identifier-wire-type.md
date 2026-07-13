---
'ox': patch
---

Fixed the EIP-1898 block identifier param type in the core `eth`/`tempo` RPC request schemas to be wire-typed (`Block.Identifier<Hex.Hex>`), so its `blockNumber` field is hex like the sibling `Block.Number<Hex.Hex>` branch instead of native `bigint`. This makes `z.RpcSchema.encodeParams` output assignable to the core request param types for block-selector methods (`eth_call`, `eth_getBalance`, `eth_getCode`, `eth_getStorageAt`, `eth_getTransactionCount`, `eth_getBlockTransactionCountByNumber`, `eth_getUncleCountByBlockNumber`, `eth_estimateGas`, etc.).
