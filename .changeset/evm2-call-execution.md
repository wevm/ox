---
"ox": minor
---

Added `ox/evm`, an EVM backed by `alloy-rs/evm2` compiled to WebAssembly, with read-only transaction execution.

```ts
import { Database, Evm, TxResult } from 'ox/evm'

const evm = await Evm.create({
  database: Database.fromMemory({
    accounts: { '0x0000000000000000000000000000000000000001': { balance: 1n } },
  }),
  specId: 'osaka',
})

const result = Evm.callTx(evm, {
  from: '0x0000000000000000000000000000000000000001',
  gas: 100_000n,
  to: '0x0000000000000000000000000000000000000002',
  value: 1n,
})
TxResult.txGasUsed(result)
```
