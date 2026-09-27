---
"ox": patch
---

Exposed `FrameRequest` and aligned frame request gas estimation, signature signers, fill responses, and simulation result types with the execution API definitions.

```ts
import { FrameRequest } from 'ox'

FrameRequest.toRpc({ mode: 'sender', stateGas: 0n })
```
