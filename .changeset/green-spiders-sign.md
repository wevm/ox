---
'ox': minor
---

Added an opt-in `ox/wasm/Secp256k1` provider backed by libsecp256k1.

```ts
import { Engine } from 'ox'
import { Secp256k1 } from 'ox/wasm'

await Engine.install({ Secp256k1: Secp256k1.engine() })
```
