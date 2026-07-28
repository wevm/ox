---
description: "Choose between Ox's default, WASM, Node, and custom cryptography engines."
---

# WASM & Engines

## Overview

Ox uses portable JavaScript cryptography by default. An [`Engine`](/api/Engine)
replaces individual implementations without changing the `Hash`, `Secp256k1`,
`Keystore`, or other public APIs that call them.

| Engine      | Runtime                       | Benefits                                  | Trade-offs                              |
| ----------- | ----------------------------- | ----------------------------------------- | --------------------------------------- |
| `ox`        | Browser, Node, and edge       | Audited, isomorphic, no setup             | Slower for some hashes                  |
| `ox/wasm`   | Runtimes with WebAssembly     | Fast, isomorphic, portable                | Async startup and memory marshalling    |
| `ox/node`   | Node.js 22 and newer          | Native OpenSSL-backed hashes              | Node-only and no Keccak256              |
| Custom      | Implementation-dependent      | Any supported primitive or provider       | You own correctness and key handling    |

Engines are partial. Anything they omit leaves the currently installed
implementation unchanged, falling back to Ox's default when no override was
installed earlier. Calls to [`Engine.set`](/api/Engine/set) merge, including
within the same slot, and Ox selects an implementation when a cryptographic
function is called.

Install an engine once during application startup, before making cryptographic
calls. The registry belongs to one loaded Ox module instance, so separate
copies of Ox have separate registries.

## Default Engine

No setup is required:

```ts twoslash
import { Hash } from 'ox'

const digest = Hash.keccak256('0xdeadbeef')
```

Ox's defaults use the
[`@noble`](https://github.com/paulmillr/noble-hashes) and
[`@scure`](https://github.com/paulmillr/scure-bip32) JavaScript libraries.
[`Engine.get()`](/api/Engine/get) returns `{}` until an override is installed
because defaults are fallbacks, not registered overrides.

**Benefits**

- Works across browsers, Node.js, and edge runtimes.
- Covers Ox's complete cryptography surface.
- Requires no initialization or runtime-specific entrypoint.
- Keeps runtime-specific dependencies out of the default entrypoint.

**Trade-offs**

- Pure JavaScript can be slower than WASM or platform-native implementations.
- It cannot use Node's OpenSSL and hardware-accelerated SHA paths.
- It may not satisfy a policy requiring a particular native, hardware, or
  validated provider.

## WASM (Web Assembly) Engine

The WASM engine compiles and installs asynchronously:

```ts twoslash
import { Hash } from 'ox'
import { Engine } from 'ox/wasm'

await Engine.load()

const digest = Hash.keccak256('0xdeadbeef')
```

It supplies `hmacSha256`, `keccak256`, `ripemd160`, and `sha256`. BLAKE3 and
every non-`Hash` operation keep their current implementation, or use Ox's
default when no earlier override exists.

Use `create` when you need the engine without installing it:

```ts twoslash
import { Engine } from 'ox/wasm'

const wasm = await Engine.create()
```

**Benefits**

- Runs in browsers, Node.js, and other runtimes with WebAssembly.
- Provides a substantial Keccak256 speedup on common runtimes.
- Keeps hashing synchronous after one asynchronous startup step.
- Embeds the compiled module, with no separate WASM asset to host.

**Trade-offs**

- Requires asynchronous initialization before cryptographic calls.
- Copies inputs and outputs across WASM linear memory.
- Gains vary by primitive, input size, runtime, and processor.
- Adds the WASM implementation without removing JavaScript fallbacks from the
  bundle.

## Node Engine

The Node engine uses the built-in `node:crypto` implementation. Its setup is
asynchronous to match `ox/wasm`, although Node requires no compilation:

```ts twoslash
import { Hash } from 'ox'
import { Engine } from 'ox/node'

await Engine.load()

const digest = Hash.sha256('0xdeadbeef')
```

It supplies `hmacSha256`, `ripemd160`, and `sha256`. Keccak256 and BLAKE3 keep
their current implementation, or use Ox's default when no earlier override
exists. Node's `sha3-256` is not Ethereum Keccak256 and must not be substituted
for it.

Use `create` to obtain the engine without installing it:

```ts twoslash
import { Engine } from 'ox/node'

const node = await Engine.create()
```

The Node and WASM engines compose through `Engine.set`:

```ts twoslash
import { Engine as NodeEngine } from 'ox/node'
import { Engine as WasmEngine } from 'ox/wasm'

await WasmEngine.load()
await NodeEngine.load()
```

The second load replaces the three overlapping hashes with Node
implementations while keeping WASM Keccak256 installed.

**Benefits**

- Uses Node's native OpenSSL-backed cryptography.
- Can use processor acceleration for SHA-256 and HMAC-SHA256.
- Requires no WASM compilation or memory marshalling.
- Lives in a separate entrypoint, so browser bundles do not resolve
  `node:crypto`.

**Trade-offs**

- Supports Node.js only and must not be imported into browser bundles.
- Does not provide Keccak256 or BLAKE3.
- Native call overhead can affect short-input rankings.
- Algorithm availability and validation modes depend on the Node and OpenSSL
  build. FIPS mode may reject RIPEMD-160.
- Leaves Ox's default fallback code available.

## Custom Engines

Install any subset of Ox's engine contract with
[`Engine.set`](/api/Engine/set):

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

Slots and primitives are optional, and repeated calls merge:

```ts twoslash
import { Engine } from 'ox'
// ---cut---
Engine.set({ Hash: { keccak256: myKeccak256 } })
Engine.set({ Secp256k1: mySecp256k1 })
// ---cut-after---
declare const myKeccak256: (input: Uint8Array) => Uint8Array
declare const mySecp256k1: NonNullable<Engine.Engine['Secp256k1']>
```

Binary values cross engine boundaries as raw `Uint8Array` values. Ox performs
`Hex` and `Bytes` conversion outside the engine boundary. Install explicitly
rather than relying on a side-effect import: Ox declares `sideEffects: false`,
so a bundler may drop an import that appears unused.

**Benefits**

- Supports synchronous native libraries and policy-required providers.
- Replaces one primitive without requiring a complete slot.
- Preserves Ox's public APIs and input/output conversion.
- Composes with the built-in Node and WASM engines.

**Trade-offs**

- The engine author owns algorithm semantics, output lengths, key formats, and
  error behavior.
- Most engine functions are synchronous. Only explicitly asynchronous
  contracts such as `scryptAsync` may return promises.
- Overrides are module-instance-global, so initialization order and concurrent
  use matter.
- Installing an engine changes dispatch but does not remove defaults from the
  bundle.

## Benchmarks

Run the engine comparison with:

```sh
pnpm bench:engines
```

The harness covers every engine slot and all 38 primitives in Ox's default
engine. The provider columns count the primitives each implementation supplies:

| Slot          | Primitives | `ox` | `ox/node` | `ox/wasm` | `alloy (Rust)` |
| ------------- | ---------- | ---- | --------- | --------- | -------------- |
| `Bls`         | 5          | 5    | n/a       | n/a       | n/a            |
| `Ed25519`     | 6          | 6    | n/a       | n/a       | n/a            |
| `Hash`        | 5          | 5    | 3         | 4         | 1              |
| `Keystore`    | 6          | 6    | n/a       | n/a       | n/a            |
| `Mnemonic`    | 1          | 1    | n/a       | n/a       | n/a            |
| `P256`        | 6          | 6    | n/a       | n/a       | n/a            |
| `Secp256k1`   | 6          | 6    | n/a       | n/a       | n/a            |
| `X25519`      | 3          | 3    | n/a       | n/a       | n/a            |
| **Total**     | **38**     | **38** | **3**     | **4**     | **1**          |

`n/a` means the provider does not implement a primitive in that slot. The
harness never times Ox's fallback under another engine's name.
`alloy-primitives` provides Keccak256 only; it is a native reference, not an Ox
engine.

Local runs on an Apple M4 Max with Node.js 25.9.0 and Rust 1.93.1 produced the
following best-observed timings (lower is better). Speedup compares the
fastest Ox engine in each row with `ox`; Alloy remains a reference only. The
full command prints every primitive and input size:

| Primitive and case                    | `ox`      | `ox/node` | `ox/wasm` | `alloy (Rust)` | Fastest Ox engine vs `ox` |
| ------------------------------------- | --------- | --------- | --------- | -------------- | ------------------------- |
| `Bls.sign`, 32 B message              | 15.59 ms  | n/a       | n/a       | n/a            | n/a                       |
| `Ed25519.sign`, 32 B message          | 198.51 µs | n/a       | n/a       | n/a            | n/a                       |
| `Hash.keccak256`, 32 B                | 2.58 µs   | n/a       | 277 ns    | 134 ns         | 9.31× (wasm)              |
| `Hash.keccak256`, 1024 KiB            | 17.91 ms  | n/a       | 1.22 ms   | 1.02 ms        | 14.64× (wasm)             |
| `Hash.sha256`, 32 B                   | 629 ns    | 468 ns    | 289 ns    | n/a            | 2.18× (wasm)              |
| `Hash.sha256`, 1024 KiB               | 3.84 ms   | 334.46 µs | 3.01 ms   | n/a            | 11.47× (node)             |
| `Hash.ripemd160`, 32 B                | 741 ns    | 567 ns    | 270 ns    | n/a            | 2.75× (wasm)              |
| `Hash.ripemd160`, 1024 KiB            | 5.90 ms   | 2.16 ms   | 2.77 ms   | n/a            | 2.73× (node)              |
| `Hash.hmacSha256`, 32 B               | 2.24 µs   | 1.08 µs   | 1.16 µs   | n/a            | 2.07× (node)              |
| `Hash.hmacSha256`, 1024 KiB           | 5.31 ms   | 462.89 µs | 5.67 ms   | n/a            | 11.47× (node)             |
| `Keystore.aesCtrEncrypt`, 4 KiB       | 38.25 µs  | n/a       | n/a       | n/a            | n/a                       |
| `Mnemonic.toSeed`, 12 words           | 5.57 ms   | n/a       | n/a       | n/a            | n/a                       |
| `P256.sign`, 32 B message             | 174.94 µs | n/a       | n/a       | n/a            | n/a                       |
| `Secp256k1.sign`, 32 B message        | 180.89 µs | n/a       | n/a       | n/a            | n/a                       |
| `X25519.getSharedSecret`, 32 B key    | 613.69 µs | n/a       | n/a       | n/a            | n/a                       |

The benchmark initializes engines outside the timed loops and sends each Ox
call through the same engine resolver. It uses identical inputs, warmups,
budgets, and repeats, and reports the best-observed repeat as a peak-throughput
microbenchmark, not a latency distribution. It measures raw single-call
byte-array implementations, not Ox formatting or whole applications. Treat the
results as runtime-specific: Node/OpenSSL, CPU acceleration, the WASM runtime,
Rust compiler, JIT state, and input size can all change the ranking.

## Testing

Reset the installed engine between tests:

```ts twoslash
import { Engine } from 'ox'
import { beforeEach } from 'vitest'

beforeEach(() => {
  Engine.reset()
})
```

For differential tests, obtain an implementation with `create`, then install it
for one synchronous call with [`Engine.with`](/api/Engine/with):

```ts twoslash
import { Engine, Hash } from 'ox'
import { Engine as WasmEngine } from 'ox/wasm'

const wasm = await WasmEngine.create()
const digest = Engine.with(wasm, () => Hash.sha256('0xdeadbeef'))
```

`Engine.with` rejects asynchronous functions because concurrent work could
observe the module-instance-global override. `Engine.set` and `Engine.reset`
clear Ox's derived cryptographic caches automatically.

Test custom implementations against published vectors, boundary-sized and
empty inputs, and an independent implementation. Verify exact digest,
signature, and key lengths rather than checking only that a call succeeds.

## Security

Treat an engine as trusted code. Depending on the slot, it can receive HMAC
keys, private keys, passwords, mnemonic phrases, and plaintext keystore
material. `Engine.set` validates slot and primitive names, but it cannot
validate correctness, constant-time behavior, or key handling.

Ox's default engine uses audited cryptographic implementations. The WASM engine
does not promise protection from timing or cache side channels. WebAssembly has
no constant-time execution guarantee. The WASM HMAC implementation clears its
copied inputs and explicit scratch buffer from linear memory in a `finally`
block, including after recoverable WebAssembly traps. It cannot clear
caller-owned buffers or runtime-managed state, and this does not make the
surrounding runtime side-channel resistant.

The Node engine inherits the properties of the active Node and OpenSSL build.
Using `node:crypto` does not itself mean FIPS mode is enabled or that every
configured provider exposes RIPEMD-160.

For threats involving precise timing measurement or hostile same-process code,
use an OS keystore, hardware-backed signer, or isolated signing service.
