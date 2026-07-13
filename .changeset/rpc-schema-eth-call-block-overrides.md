---
'ox': patch
---

Added an optional 4th `blockOverrides` parameter to the `eth_call` and `eth_estimateGas` schemas (`RpcSchema.Default` and the zod `RpcSchema.Eth`), matching Geth/Anvil's `eth_call(transaction, block, stateOverrides, blockOverrides)` signature.
