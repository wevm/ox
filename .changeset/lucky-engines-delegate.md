---
'ox': minor
---

Added `Engine` for delegating ox's cryptography to a different implementation.

```ts
import { Engine, Hash } from 'ox'

Engine.set({ Hash: { keccak256: myKeccak256 } })

Hash.keccak256('0xdeadbeef')
```

Slots are named after ox modules, and both slots and the functions within them
are optional -- anything omitted keeps using ox's `@noble/*` and `@scure/*`
defaults, so existing behavior is unchanged. `Hash`, `Secp256k1`, `P256`,
`Ed25519`, `X25519`, `Keystore` and `Mnemonic` are routed through the engine.
