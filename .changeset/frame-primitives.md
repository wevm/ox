---
"ox": minor
---

Added `Frame` and `FrameSignature` utilities for EIP-8141 frame encoding and structured signatures.

```ts
import { Frame } from 'ox'

const tuple = Frame.toTuple({
  executionGasLimit: 50_000n,
  flags: 3,
  mode: 1,
})
```
