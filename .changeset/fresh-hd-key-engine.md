---
'ox': patch
---

Added an `HdKey` engine boundary for seed import, extended-key import, and derivation.

```ts
import { Engine } from 'ox'
import { hdKey } from './hd-key-engine.js'

type CompleteHdKey = {
  [name in keyof Engine.HdKey]-?: NonNullable<Engine.HdKey[name]>
}

const completeHdKey: CompleteHdKey = hdKey
Engine.set({ HdKey: completeHdKey })
```
