---
"ox": minor
---

Added `Evm.setInspector` and `Evm.clearInspector`, which record what an execution did and report it as a trace on the result.

```ts
import { Evm, Inspector } from 'ox/evm'

Evm.setInspector(evm, {})

const result = Evm.callTx(evm, transaction)
const [root] = Inspector.tree(result.trace)
root.calls.length
```
