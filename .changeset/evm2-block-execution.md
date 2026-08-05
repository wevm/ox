---
"ox": minor
---

Added block execution: gather what a block's transactions change, apply caller-held state back to an EVM, and run protocol system calls.

```ts
import { Evm, ExecutedTx, System } from 'ox/evm'

Evm.setBlockState(evm, true)
Evm.systemCall(evm, { address: System.beaconRoots, data: root })

for (const transaction of transactions)
  ExecutedTx.commitTo(Evm.transact(evm, transaction))

const block = Evm.takeBlockState(evm)
```
