---
"ox": minor
---

Added the `ox/evm` entrypoint: a pure-TypeScript EVM interpreter (`Evm.run` over the stateless instruction set), plus `Opcode` and `Hardfork` modules.

```ts
import { Evm } from 'ox/evm'

const result = Evm.run({ bytecode: '0x60016002015f5260205ff3' })
// { status: 'success', output: '0x…03', gasUsed: 22n, ... }
```
