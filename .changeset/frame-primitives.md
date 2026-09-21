---
"ox": minor
---

Added `Frame` and `FrameSignature` utilities for EIP-8141 frame and signature encoding.

```ts
import { Frame } from 'ox'

const tuple = Frame.toTuple({
  mode: 1,
  flags: 3,
  executionGasLimit: 50_000n,
  stateGasLimit: 0n,
  value: 0n,
  data: '0x',
})
```
