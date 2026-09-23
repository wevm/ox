---
"ox": patch
---

Renamed `Frame.gas` to `Frame.executionGas`.

```ts
import { Frame } from 'ox'

Frame.from({ executionGas: 50_000n, stateGas: 1_000n })
```
