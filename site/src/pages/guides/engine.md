---
description: "Delegate Ox's cryptography to a different implementation."
---

# Crypto Engines

Ox implements its cryptography with [`@noble`](https://github.com/paulmillr/noble-hashes) and [`@scure`](https://github.com/paulmillr/scure-bip32) — audited, minimal, dependency-free JavaScript libraries. That is the right default: it works in every runtime, it is small, and it needs no build step.

Sometimes you want something else. A native implementation can be substantially faster — [`ox/wasm`](/wasm) hashes Keccak256 around 12–14× faster than the default. A hardware or platform-native implementation may be required by policy. [`Engine`](/api/Engine) lets you supply one without forking Ox.

## Installing an Engine

An engine is a plain object whose keys are named after Ox modules:

```ts twoslash
import { Engine } from 'ox'

Engine.set({
  Hash: {
    keccak256: (input) => myKeccak256(input),
  },
})
// ---cut-after---
declare function myKeccak256(input: Uint8Array): Uint8Array
```

Every slot, and every function within a slot, is optional. Anything you leave out keeps using Ox's default, so an engine that implements only `keccak256` is perfectly valid — everything else is untouched.

Calls to `Engine.set` merge, so you can install an engine and then override one primitive:

```ts twoslash
import { Engine } from 'ox'
// ---cut---
Engine.set(myEngine)
Engine.set({ Hash: { keccak256: myFasterKeccak256 } })
// ---cut-after---
declare const myEngine: Engine.Engine
declare function myFasterKeccak256(input: Uint8Array): Uint8Array
```

Engine functions take and return plain `Uint8Array` values, not Ox's `Hex` or `Bytes` types. Coercion stays in the Ox module, so an engine only ever deals in bytes.

## Asynchronous Initialization

Ox's crypto functions are synchronous, but WASM must be compiled asynchronously — browsers refuse to compile modules larger than a few kilobytes synchronously on the main thread. Each entrypoint exports an `Engine` whose `load` does both, so the `await` appears once:

```ts twoslash
// @noErrors
import { Engine } from 'ox/wasm'

await Engine.load()
```

`Engine.set` itself is synchronous and expects a fully initialized engine.

Combining an entrypoint's engine with your own does not need anything further, because `set` merges — both across slots and within one:

```ts twoslash
// @noErrors
import { Engine } from 'ox'
import { Engine as Wasm } from 'ox/wasm'

await Wasm.load()
Engine.set({ Secp256k1: mySecp256k1 })
```

Where an engine has to exist as a value — measuring one implementation against another, or installing for the duration of a call — `create` returns it without installing:

```ts twoslash
// @noErrors
import { Engine, Hash } from 'ox'
import { Engine as Wasm } from 'ox/wasm'

const wasm = await Wasm.create()

Engine.with(wasm, () => Hash.keccak256('0xdeadbeef'))
```

## Call Order

Ox resolves the engine at call time. Anything computed before `Engine.set` used whatever implementation was installed then:

```ts twoslash
import { Engine, Hash } from 'ox'
// ---cut---
Hash.keccak256('0xdeadbeef') // uses the default
Engine.set(myEngine)
Hash.keccak256('0xdeadbeef') // uses myEngine
// ---cut-after---
declare const myEngine: Engine.Engine
```

Install your engine once, during application startup, before any crypto call.

There is deliberately no side-effect import that installs an engine for you (`import 'ox/wasm/register'` and the like). Ox declares `sideEffects: false`, so a bundler would be free to drop such an import and your engine would silently never install. `Engine.set` is an explicit call for that reason.

## Measure Before You Switch

An engine is not automatically faster. Each call crosses a boundary — copying bytes into WASM memory and back — and for cheap operations that cost can exceed the work itself.

Measured with `pnpm bench` on Node 22, against `@noble/hashes` 2.2.0:

| operation                    | speedup with `ox/wasm` |
| ---------------------------- | ---------------------- |
| `Hash.keccak256`, any size   | ~12–14×                |
| `Hash.sha256`, 32 bytes      | ~3×                    |
| `Hash.sha256`, 1 MiB         | ~1.1×                  |

The Keccak256 gap is large at every size because the default implementation is unusually slow there — around 19 MB/s, against roughly 148 MB/s for its own SHA-256. Since Keccak256 is the hash Ox reaches for most (every address checksum, every signature recovery), that is the clearest win available.

SHA-256 is a much narrower margin, and it narrows further as inputs grow. Re-measure on your own runtime before assuming a gain: these numbers move with the engine and the machine.

### Against Native Code

`pnpm bench` compares the default against `ox/wasm`. To see both against native Rust, `pnpm bench:hash` adds a third column from `bench/native`, covering every primitive `ox/wasm` implements. It needs `cargo`, and omits that column without it.

That column is a ceiling, not a target: native code has no VM and no boundary to cross. It is useful for knowing how much of the remaining gap is worth chasing. On Apple Silicon, `ox/wasm` lands within ~1.15× of `alloy-primitives` for large Keccak256 inputs, and is *faster* than the `ripemd` crate above 256 bytes.

## Engines and Bundle Size

Installing an engine changes *which implementation Ox calls*. It does not remove the default implementation from your bundle.

Two reasons:

- Ox's crypto modules keep their `@noble/*` import as the fallback for any slot you do not fill.
- Each crypto module exports the underlying implementation as an escape hatch — [`Secp256k1.noble`](/api/Secp256k1), [`P256.noble`](/api/P256), [`Ed25519.noble`](/api/Ed25519), [`X25519.noble`](/api/X25519), [`Bls.noble`](/api/Bls). These always refer to the bundled `@noble/*` implementation and are never affected by `Engine.set`.

So reach for an engine when you want a *faster* or *policy-mandated* implementation, not a smaller bundle.

## Synchronous and Asynchronous Variants

Where Ox exposes both a synchronous and an asynchronous function — [`Keystore.scrypt`](/api/Keystore/scrypt) and [`Keystore.scryptAsync`](/api/Keystore/scryptAsync), for instance — the corresponding engine functions resolve independently. Supplying `scrypt` alone leaves `scryptAsync` on the default implementation.

That is intentional. Wrapping a long synchronous computation in a promise blocks the event loop just as much as calling it directly, so it is worse than an implementation that genuinely yields.

## Scoped Overrides

For tests and benchmarks, [`Engine.with`](/api/Engine/with) installs an engine for the duration of a synchronous function and restores the previous one afterwards, including on throw:

```ts twoslash
import { Engine, Hash } from 'ox'

const hash = Engine.with({ Hash: { keccak256: () => new Uint8Array(32) } }, () =>
  Hash.keccak256('0xdeadbeef'),
)
```

The engine is process-wide, so this is only safe for synchronous functions — concurrent asynchronous work would observe the override too. Passing an asynchronous function throws `Engine.AsyncScopeError`.

## Caches

`Caches` memoizes values derived from cryptography, such as address checksums. `Engine.set` and `Engine.reset` clear them, so a swapped hash implementation never returns a stale cached value.

## Testing

Reset the engine between tests, or one test's engine leaks into the next:

```ts twoslash
// @noErrors
import { Engine } from 'ox'
import { beforeEach } from 'vitest'

beforeEach(() => {
  Engine.reset()
})
```

## Multiple Copies of Ox

The engine registry belongs to the Ox module instance that owns it. If your dependency graph contains two copies of Ox, each has its own registry, and installing an engine on one will not affect the other. Deduplicate Ox in your lockfile if you hit this.

## Security

Neither the default implementation nor a WASM engine is hardened against timing or cache side-channel attacks. WebAssembly provides no constant-time guarantees at all: the specification says nothing about instruction timing, engines re-optimize functions once they are hot, and branchless source code is not guaranteed to stay branchless.

If an attacker can execute code in the same process or measure your timing precisely, use a hardware signer or an OS keystore rather than either implementation.
