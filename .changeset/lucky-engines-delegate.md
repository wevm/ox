---
'ox': minor
---

Added `Engine`, which swaps ox's cryptography for another implementation across the `Bls`, `Ed25519`, `Hash`, `Keystore`, `Mnemonic`, `P256`, `Secp256k1` and `X25519` slots.

```ts
import { Engine, Hash } from 'ox'

Engine.set({ Hash: { keccak256: myKeccak256 } })

Hash.keccak256('0xdeadbeef')
```
