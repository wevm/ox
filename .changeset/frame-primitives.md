---
"ox": minor
---

Added `TxFrame` and `TxFrameSignature` utilities for EIP-8141 frame and signature encoding.

```ts
import { TxFrame } from 'ox'

const tuple = TxFrame.toTuple({
  mode: 1,
  flags: 3,
  executionGasLimit: 50_000n,
  stateGasLimit: 0n,
  value: 0n,
  data: '0x',
})
```
