---
"ox": minor
---

Added the `ox/evm` entrypoint: a pure-TypeScript EVM interpreter (`Evm.run`) with journaled state execution over pluggable sources (`EvmState`), plus `Opcode` and `Hardfork` modules.

```ts
import { Evm, EvmState } from 'ox/evm'

const state = EvmState.fromMemory({
  accounts: { '0x…': { balance: 10n ** 18n } },
})
const result = Evm.run({ address: '0x…', bytecode: '0x…', state })
// { status: 'success', output: '0x…', gasUsed: 22n, gasRefund: 0n, logs: [] }
```
