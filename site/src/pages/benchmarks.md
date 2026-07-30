---
description: "Compare Ox v0, core, Node, and WASM performance."
---

# Benchmarks

These benchmarks compare high-level operations across Ox v0, Ox's default
implementations, the Node.js engine, and the WASM engine. Lower timings are
better.

The following results are mean single-call durations from an Apple M4 Max
running macOS 26.5.2 and Node.js 25.9.0. The comparison uses Ox 1.2.0 and Ox
v0.14.33. The fastest result in each row is bold.

| Operation | `ox v0` | `ox` | `ox/node` | `ox/wasm` |
| --- | ---: | ---: | ---: | ---: |
| `AbiFunction.encodeData` (cached) | 13.4 µs | **12.9 µs** | 13.1 µs | 13.1 µs |
| `AbiFunction.encodeData` (dynamic) | 39.4 µs | 33.7 µs | 33.7 µs | **29.2 µs** |
| `TransactionEnvelope.getSignPayload` | 5.5 µs | 3.9 µs | 3.9 µs | **1.5 µs** |
| `PersonalMessage.getSignPayload` | 4.5 µs | 3.3 µs | 3.3 µs | **1.0 µs** |
| `ContractAddress.fromCreate2` | 14.0 µs | 11.2 µs | 11.2 µs | **6.5 µs** |
| `AbiEvent.encode` | 4.5 µs | 3.3 µs | 3.3 µs | **0.9 µs** |
| `TypedData.getSignPayload` | 70.9 µs | 49.1 µs | 48.5 µs | **15.9 µs** |
| `Keystore.decrypt` | 5.8 µs | 4.7 µs | 5.3 µs | **2.3 µs** |
| `Mnemonic.toPrivateKey` | 6.98 ms | 7.09 ms | **1.76 ms** | 3.03 ms |
| `Secp256k1.randomPrivateKey` | **1.7 µs** | 5.8 µs | 5.8 µs | 6.0 µs |

WASM has the largest effect on operations that perform one or more
Keccak-256 hashes. Node.js has the largest effect on mnemonic derivation
because its engine supplies native PBKDF2.

ABI encoding remains mostly JavaScript data-layout work. The cached case
extracts and prepares Seaport's `fulfillOrder` function before measurement.
The dynamic case searches the complete Seaport ABI and prepares the function
inside every measured call.

`Secp256k1.randomPrivateKey` uses the same host-backed Ox implementation for
`ox`, `ox/node`, and `ox/wasm`. The Node.js and WASM engines do not override
random secp256k1 key generation.

## Method

Run the comparison from the Ox repository:

```sh
pnpm bench:comparison --run
```

The harness uses Vitest bench through Vite+. It runs each provider in an
isolated file and runs the files sequentially to avoid CPU contention. Every
provider receives the same inputs and output formats.

Provider initialization, WASM compilation, fixture preparation, and keystore
key derivation happen outside the timed functions. The `ox/wasm` variant
combines the aggregate WASM engine with its opt-in Keystore and Secp256k1
providers.

Ox v0 does not expose the generic
`TransactionEnvelope.getSignPayload` function. That column uses
`TxEnvelopeEip1559.getSignPayload`, the v0 equivalent for the EIP-1559
fixture.

Ox exposes event topic encoding as `AbiEvent.encode`. This benchmark measures
the operation sometimes described as `AbiEvent.encodeTopics`.

These results are a local snapshot, not a performance guarantee. CPU,
JavaScript runtime, OpenSSL, WASM runtime, inputs, and background load can
change both timings and rankings. For lower-level cryptographic measurements,
see [WASM and engine benchmarks](/guides/engine#benchmarks).
