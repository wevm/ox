---
'ox': patch
---

Updated the zod `RpcSchema.Eth` request-bearing methods (`eth_call`, `eth_estimateGas`, `eth_sendTransaction`, `eth_signTransaction`, `eth_simulateV1`) to encode their transaction-request params with `TransactionRequestToRpc`, so `RpcSchema.encodeParams` now accepts numberish (`bigint | number | Hex`) quantities. Decoded output is unchanged.
