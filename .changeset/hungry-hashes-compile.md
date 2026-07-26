---
'ox': minor
---

Added `ox/wasm`, providing WASM implementations of ox's cryptography for use with `Engine`.

```ts
import { Engine, Hash as OxHash } from 'ox'
import { Hash } from 'ox/wasm'

Engine.set(await Hash.load())

OxHash.keccak256('0xdeadbeef')
```

The first release covers `keccak256`, `sha256`, `ripemd160` and HMAC-SHA256,
compiled from hand-written C. Measured against `@noble/hashes` 2.2.0,
`keccak256` is ~12-14x faster at every input size and `sha256` is ~1.1-3x
faster.

The artifacts are built by `pnpm wasm:build` from a toolchain pinned in
`wasm/toolchain.json`, and `pnpm wasm:check` verifies in CI that the committed
bytes still match their C sources. The TIP-1022 salt miner's WASM is now built the
same way, making it reproducible again.
