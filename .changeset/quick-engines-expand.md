---
'ox': minor
---

Added Node and WASM engines for hashes, AES-CTR, PBKDF2, BIP-39 seeds, Ed25519, X25519, and P256 public-key derivation.

```ts
import { Engine } from 'ox/wasm'

await Engine.load()
```
