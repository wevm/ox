---
"ox": minor
---

Added EIP-7928 block access lists: attach one so reads are gated by what it covers, or build one from executed transactions.

```ts
import { Bal, Evm } from 'ox/evm'

// Validating: a read the list does not cover is refused, not served.
Evm.setBal(evm, bal)

// Building: transaction `i` records at index `i + 1`.
Evm.setBalBuilder(evm, true)
Evm.setBalIndex(evm, 1n)
Evm.transact(evm, transaction)
const built = Evm.takeBal(evm)
```
