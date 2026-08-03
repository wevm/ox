---
"ox": minor
---

Added the `ox/evm` entrypoint: a pure-TypeScript EVM interpreter (`Evm.run`) with nested message calls and journaled state execution over pluggable sources (`State`), plus `Opcode` and `Hardfork` modules.

```ts
import { Evm, State } from 'ox/evm'

const state = State.fromMemory({
  accounts: { '0x…': { balance: 10n ** 18n } },
})
const result = Evm.run({ address: '0x…', bytecode: '0x…', state })
// { status: 'success', output: '0x…', gasUsed: 22n, gasRefund: 0n, logs: [] }
```
