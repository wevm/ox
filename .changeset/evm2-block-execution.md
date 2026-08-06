---
"ox": minor
---

Added block execution: gather what a block's transactions change, apply caller-held state back to an EVM, and run protocol system calls.

```ts
import { Evm, ExecutedTx, System } from 'ox/evm'

const block = Evm.startBlockState(evm)

ExecutedTx.commitTo(
  Evm.systemCall(evm, { address: System.beaconRoots, data: root }),
  block,
)
for (const transaction of transactions)
  ExecutedTx.commitTo(Evm.transact(evm, transaction), block)

const state = Evm.takeBlockState(evm, block)
```
