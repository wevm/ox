---
"ox": minor
---

Added `Frame` and `FrameSignature` utilities for EIP-8141 frame encoding and structured signatures.

```ts
import { Frame } from 'ox'

const tuple = Frame.toTuple({
  flags: 3,
  gas: 50_000n,
  mode: 1,
})
```
