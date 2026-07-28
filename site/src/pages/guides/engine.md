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
| `ox`        | Browser, Node, and edge       | Audited, isomorphic, no setup             | Slower for some primitives              |
| `ox/wasm`   | Runtimes with WebAssembly     | Fast, isomorphic, portable                | Async startup and memory marshalling    |
| `ox/node`   | Node.js 22 and newer          | Native cryptography, no compilation       | Node-only and intentionally partial     |
| Custom      | Implementation-dependent      | Any supported primitive or provider       | You own correctness and key handling    |

Engines are partial. Anything they omit leaves the currently installed
implementation unchanged, falling back to Ox's default when no override was
installed earlier. [`Engine.install`](/api/Engine/install) resolves selected
provider modules in parallel and installs them only after every module is
ready. Calls merge, including within the same slot, and Ox selects an
implementation when a cryptographic function is called.

Install an engine once during application startup, before making cryptographic
calls. The registry belongs to one loaded Ox module instance, so separate
copies of Ox have separate registries.

## Default Engine

No setup is required:

```ts twoslash
import { Hash } from 'ox'

const digest = Hash.blake3('0xdeadbeef')
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
import { Engine, Hash } from 'ox/wasm'

await Engine.install()

const digest = Hash.keccak256('0xdeadbeef')
```

It supplies the following partial slots:

- `Hash`: BLAKE3, HMAC-SHA256, Keccak256, RIPEMD-160, and SHA-256.
- `Keystore`: synchronous PBKDF2-HMAC-SHA256.
- `Mnemonic`: BIP-39 seed derivation.
- `Ed25519`: public-key derivation, signing, verification, and private-key
  conversion to X25519.
- `X25519`: public-key derivation and shared-secret calculation.

Other operations keep their current implementation, or use Ox's default when
no earlier override exists. In particular, asynchronous KDFs remain on the
default because wrapping synchronous WASM in a promise would not make it yield.

Provider modules expose the regular Ox API alongside an `engine` factory. Use
this to install only the modules an application needs:

```ts twoslash
import { Engine } from 'ox'
import { Hash } from 'ox/wasm'

await Engine.install({
  Hash: Hash.engine(),
})

const digest = Hash.blake3('0xdeadbeef')
```

`Engine.install` awaits all supplied slot promises together, then installs the
resolved modules atomically. `Hash.engine()` returns the raw `Hash` slot;
`Hash.blake3()` remains the normal formatted public API.

**Benefits**

- Runs in browsers, Node.js, and other runtimes with WebAssembly.
- Accelerates hashes, key derivation, Ed25519, and X25519 on common runtimes.
- Keeps cryptographic calls synchronous after one asynchronous startup step.
- Embeds the compiled module, with no separate WASM asset to host.
- Clears copied secret inputs, staged outputs, and explicit workspaces after
  each sensitive call, including after recoverable traps.

**Trade-offs**

- Requires asynchronous initialization before cryptographic calls.
- Copies inputs and outputs across WASM linear memory.
- Gains vary by primitive, input size, runtime, and processor.
- Adds the WASM implementation without removing JavaScript fallbacks from the
  bundle.
- Uses pinned portable C implementations that Ox must keep reviewed and
  updated.

## Node Engine

The Node engine uses the built-in `node:crypto` implementation. Its setup is
asynchronous to match `ox/wasm`, although Node requires no compilation:

```ts twoslash
import { Engine, Hash } from 'ox/node'

await Engine.install()

const digest = Hash.sha256('0xdeadbeef')
```

It supplies the following partial slots:

- `Hash`: HMAC-SHA256, RIPEMD-160, and SHA-256.
- `Keystore`: AES-CTR and synchronous/asynchronous PBKDF2-HMAC-SHA256.
- `Mnemonic`: BIP-39 seed derivation.
- `Ed25519`: public-key derivation, signing, and private-key conversion to
  X25519.
- `P256`: public-key derivation.
- `X25519`: public-key derivation and shared-secret calculation.

Other operations keep their current implementation, or use Ox's default when
no earlier override exists. Node's `sha3-256` is not Ethereum Keccak256 and
must not be substituted for it. Ed25519 verification stays on the default
because Node/OpenSSL does not implement Ox's ZIP-215 semantics. Scrypt also
stays on the default because OpenSSL rejects parameter combinations accepted
by Ox's public API.

Install one Node module through the same core API:

```ts twoslash
import { Engine } from 'ox'
import { Hash } from 'ox/node'

await Engine.install({
  Hash: Hash.engine(),
})

const digest = Hash.sha256('0xdeadbeef')
```

### Selecting Node and WASM modules

Select modules from different providers in one atomic installation:

```ts twoslash
import { Engine, Hash } from 'ox'
import { Hash as NodeHash } from 'ox/node'
import { Ed25519 as WasmEd25519 } from 'ox/wasm'

await Engine.install({
  Ed25519: WasmEd25519.engine(),
  Hash: NodeHash.engine(),
})

const digest = Hash.sha256('0xdeadbeef')
```

The factories begin initializing while the argument is evaluated, then
`Engine.install` awaits them together. If any factory rejects, none of the
resolved modules are installed.

Repeated installations merge primitives. Installing Node's `Hash` after WASM
keeps WASM-only BLAKE3 and Keccak256 installed while replacing the three
overlapping hashes. Reset the slot first when replacing it completely:

```ts twoslash
import { Engine } from 'ox'
import { Hash } from 'ox/node'

Engine.reset('Hash')
await Engine.install({ Hash: Hash.engine() })
```

**Benefits**

- Uses Node's native OpenSSL-backed cryptography and libuv threadpool.
- Can use processor acceleration for hashes, AES, and supported curves.
- Requires no WASM compilation or memory marshalling.
- Lives in a separate entrypoint, so browser bundles do not resolve
  `node:crypto`.

**Trade-offs**

- Supports Node.js only and must not be imported into browser bundles.
- Does not provide Keccak256, BLAKE3, scrypt, or ZIP-215 verification.
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

Use `Engine.install` when one or more custom modules are asynchronous. Values
may be slots or promises of slots:

```ts twoslash
import { Engine } from 'ox'

await Engine.install({
  Hash: Promise.resolve({ keccak256: myKeccak256 }),
})
// ---cut-after---
declare const myKeccak256: (input: Uint8Array) => Uint8Array
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

- The engine author owns algorithm semantics, validation, output lengths, key
  formats, and error behavior.
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

Run focused benchmarks for the added public hash, serialized BLS, and HD-key
paths with:

```sh
pnpm bench --project core src/core/Hash.bench.ts src/core/Bls.bench.ts src/core/Bls_crypto.bench.ts src/core/HdKey.bench.ts
```

Run the BLS boundary benchmarks in supported browsers with:

```sh
pnpm bench --project browser src/core/Bls.bench.ts --testNamePattern 'Bls\.(getPublicKey|sign|verify)'
```

The harness covers every engine slot and all 41 primitives in Ox's default
engine. The provider columns count the primitives each implementation supplies:

| Slot          | Primitives | `ox` | `ox/node` | `ox/wasm` | `alloy (Rust)` |
| ------------- | ---------- | ---- | --------- | --------- | -------------- |
| `Bls`         | 5          | 5    | n/a       | n/a       | n/a            |
| `Ed25519`     | 6          | 6    | 3         | 4         | n/a            |
| `Hash`        | 5          | 5    | 3         | 5         | 1              |
| `HdKey`       | 3          | 3    | n/a       | n/a       | n/a            |
| `Keystore`    | 6          | 6    | 4         | 1         | n/a            |
| `Mnemonic`    | 1          | 1    | 1         | 1         | n/a            |
| `P256`        | 6          | 6    | 1         | n/a       | n/a            |
| `Secp256k1`   | 6          | 6    | n/a       | n/a       | n/a            |
| `X25519`      | 3          | 3    | 2         | 2         | n/a            |
| **Total**     | **41**     | **41** | **14**    | **13**    | **1**          |

`n/a` means the provider does not implement a primitive in that slot. The
harness never times Ox's fallback under another engine's name.
`alloy-primitives` provides Keccak256 only; it is a native reference, not an Ox
engine.

Local runs on an Apple M4 Max with Node.js 25.9.0 and Rust 1.93.1, using 50 ms
warmups, 200 ms measurement budgets, and three repeats, produced the following
best-observed timings (lower is better). Speedup compares the fastest Ox engine
in each row with `ox`; Alloy remains a reference only. The full command prints
every primitive and input size:

| Primitive and case                    | `ox`      | `ox/node` | `ox/wasm` | `alloy (Rust)` | Fastest Ox engine vs `ox` |
| ------------------------------------- | --------- | --------- | --------- | -------------- | ------------------------- |
| `Bls.sign`, 32 B message              | 15.52 ms  | n/a       | n/a       | n/a            | n/a                       |
| `Ed25519.getPublicKey`, 32 B key      | 95.37 µs  | 40.68 µs  | 21.75 µs  | n/a            | 4.38× (wasm)              |
| `Ed25519.sign`, 32 B message          | 195.58 µs | 40.30 µs  | 43.92 µs  | n/a            | 4.85× (node)              |
| `Ed25519.verify`, 32 B message        | 952.85 µs | n/a       | 58.06 µs  | n/a            | 16.41× (wasm)             |
| `Hash.blake3`, 32 B                   | 1.21 µs   | n/a       | 421 ns    | n/a            | 2.87× (wasm)              |
| `Hash.blake3`, 1024 KiB               | 11.06 ms  | n/a       | 1.03 ms   | n/a            | 10.75× (wasm)             |
| `Hash.keccak256`, 32 B                | 2.57 µs   | n/a       | 274 ns    | 129 ns         | 9.40× (wasm)              |
| `Hash.keccak256`, 1024 KiB            | 18.00 ms  | n/a       | 1.24 ms   | 1.04 ms        | 14.52× (wasm)             |
| `Hash.sha256`, 1024 KiB               | 3.81 ms   | 348.39 µs | 2.96 ms   | n/a            | 10.93× (node)             |
| `Keystore.aesCtrEncrypt`, 4 KiB       | 28.85 µs  | 2.71 µs   | n/a       | n/a            | 10.66× (node)             |
| `Keystore.pbkdf2Sha256`, 262,144 runs | 234.08 ms | 21.55 ms  | 98.52 ms  | n/a            | 10.86× (node)             |
| `Mnemonic.toSeed`, 12 words           | 5.60 ms   | 441.33 µs | 1.87 ms   | n/a            | 12.69× (node)             |
| `P256.getPublicKey`, 32 B key         | 135.07 µs | 10.48 µs  | n/a       | n/a            | 12.89× (node)             |
| `X25519.getSharedSecret`, 32 B key    | 597.48 µs | 47.00 µs  | 40.70 µs  | n/a            | 14.68× (wasm)             |

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

For differential tests, obtain an implementation with `engine`, then install it
for one synchronous call with [`Engine.with`](/api/Engine/with):

```ts twoslash
import { Engine, Hash } from 'ox'
import { Engine as WasmEngine } from 'ox/wasm'

const wasm = await WasmEngine.engine()
const digest = Engine.with(wasm, () => Hash.sha256('0xdeadbeef'))
```

`Engine.with` rejects asynchronous functions because concurrent work could
observe the module-instance-global override. `Engine.install`, `Engine.set`,
and `Engine.reset` clear Ox's derived cryptographic caches automatically.

Test custom implementations against published vectors, boundary-sized and
empty inputs, and an independent implementation. Verify exact digest,
signature, and key lengths rather than checking only that a call succeeds.

Ox's built-in engines add independent conformance coverage for NIST AES-CTR,
RFC 7914 PBKDF2, RFC 8032 Ed25519, all 196 ZIP-215 verification cases, RFC 7748
X25519, libsodium's low-order X25519 corpus, official BLAKE3 vectors, published
BIP-32 vectors, the
[Ethereum BLS12-381 signature suite](https://github.com/ethereum/bls12-381-tests/releases/tag/v0.1.0),
and English and Japanese BIP-39 vectors. Differential fuzz tests also cover
subviews, input immutability, output ownership, interleaved providers, memory
growth, and boundary-sized inputs. WASM conformance runs in Chromium, Firefox,
and WebKit as well as Node.js.

## Security

Treat an engine as trusted code. Depending on the slot, it can receive HMAC
keys, private keys, BIP-32 seeds and extended private keys, passwords, mnemonic
phrases, and plaintext keystore material. `Engine.install` and `Engine.set`
validate slot and primitive names, but they cannot validate correctness,
constant-time behavior, or key handling.

Ox's default engine uses audited cryptographic implementations. The WASM engine
does not promise protection from timing or cache side channels. WebAssembly has
[no constant-time execution guarantee](https://webassembly.org/docs/security/).
The WASM providers clear copied secret inputs, staged outputs, and explicit
workspaces from linear memory in `finally` blocks, including after recoverable
WebAssembly traps. They cannot clear caller-owned buffers, JavaScript strings,
runtime-managed state, or every compiler-created stack temporary. This does
not make the surrounding runtime side-channel resistant.

The WASM curve and mnemonic provider pins
[Monocypher 4.0.3](https://github.com/LoupVaillant/Monocypher/tree/4.0.3).
Its published Cure53 audit covered version 3.1.1, not the 4.x series, and 4.0.3
includes a fix recorded in Monocypher's
[security disclosures](https://monocypher.org/quality-assurance/disclosures).
The BLAKE3 provider pins the official portable C implementation and disables
architecture-specific SIMD and atomics.

The Node engine inherits the properties of the active Node and OpenSSL build.
Using `node:crypto` does not itself mean FIPS mode is enabled or that every
configured provider exposes RIPEMD-160.

For threats involving precise timing measurement or hostile same-process code,
use an OS keystore, hardware-backed signer, or isolated signing service.
