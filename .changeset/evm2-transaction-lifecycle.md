---
"ox": minor
---

Added `Evm.transact`, which keeps a transaction's state changes pending so the caller commits, discards, or detaches them.

```ts
import { Evm, ExecutedTx, PendingState } from 'ox/evm'

// `using` discards on scope exit, so an early return cannot leave the EVM held.
using executed = Evm.transact(evm, { envelope, signer })

if (ExecutedTx.result(executed).status) ExecutedTx.commit(executed)

// Or take the changes instead of accepting them.
const { pendingState } = ExecutedTx.detach(Evm.transact(evm, next))
PendingState.accountInfo(pendingState, '0x0000000000000000000000000000000000000001')
```
