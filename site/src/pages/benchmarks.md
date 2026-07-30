---
description: "Compare Ox implementations and engine provider performance."
---

# Benchmarks

These benchmarks compare high-level operations across Ox implementations and
engine providers. Lower timings are better.

The following results are mean single-call durations from an Apple M4 Max
running macOS 26.5.2 and Node.js 25.9.0. The comparison uses Ox 1.2.0 and
0.14.33. The fastest result in each row is bold.

| Task | Operation | `ox v0` | `ox` | `ox/node` | `ox/wasm` | Fastest vs. Ox v0 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Encode Seaport Fulfill Order | `AbiFunction.encodeData` (cached) | 13.4 µs | 7.4 µs | 7.3 µs | **7.2 µs** | 1.9× faster |
| Encode Seaport Fulfill Order | `AbiFunction.encodeData` (dynamic) | 39.5 µs | 29.3 µs | 28.4 µs | **24.1 µs** | 1.6× faster |
| Encode Uniswap V2 Swap | `AbiFunction.encodeData` (cached) | 1.72 µs | 1.08 µs | **1.07 µs** | 1.19 µs | 1.6× faster |
| Encode Uniswap V2 Swap | `AbiFunction.encodeData` (dynamic) | 8.8 µs | 6.9 µs | 6.7 µs | **4.2 µs** | 2.1× faster |
| Get Transaction Sign Payload | `TransactionEnvelope.getSignPayload` | 5.6 µs | 3.9 µs | 4.0 µs | **1.5 µs** | 3.6× faster |
| Get Personal Message Sign Payload | `PersonalMessage.getSignPayload` | 4.9 µs | 3.4 µs | 3.4 µs | **1.0 µs** | 4.8× faster |
| Derive CREATE2 Contract Address | `ContractAddress.fromCreate2` | 14.7 µs | 11.4 µs | 11.6 µs | **6.8 µs** | 2.2× faster |
| Encode Event Topics | `AbiEvent.encode` | 4.5 µs | 3.3 µs | 3.3 µs | **1.0 µs** | 4.7× faster |
| Hash Typed Data | `TypedData.getSignPayload` | 70.3 µs | 52.0 µs | 52.5 µs | **20.0 µs** | 3.5× faster |
| Decrypt JSON Keystore | `Keystore.decrypt` | 5.9 µs | 4.7 µs | 5.2 µs | **2.4 µs** | 2.5× faster |
| Derive Mnemonic Private Key | `Mnemonic.toPrivateKey` | 7.26 ms | 7.34 ms | **1.82 ms** | 3.04 ms | 4.0× faster |
| Calculate Swap Input Amount | `getAmountIn` (bigint) | 484.0 ns | 526.4 ns | 480.0 ns | **479.6 ns** | 1.0× faster |
| Calculate Swap Output Amount | `getAmountOut` (bigint) | 186.7 ns | **184.4 ns** | 191.3 ns | 184.7 ns | 1.0× faster |
| Encode RLP Struct | `Rlp.fromBytes` | 257.0 ns | 118.5 ns | 118.9 ns | **117.6 ns** | 2.2× faster |
| Decode RLP Struct | `Rlp.toBytes` | **146.8 ns** | 149.9 ns | 150.7 ns | 161.0 ns | Baseline |

WASM has the largest effect on operations that perform one or more
Keccak-256 hashes. Node.js has the largest effect on mnemonic derivation
because its engine supplies native PBKDF2.

ABI encoding remains mostly JavaScript data-layout work. The cached case
extracts and prepares Seaport's `fulfillOrder` function before measurement.
The dynamic case searches the complete Seaport ABI and prepares the function
inside every measured call.

The Uniswap V2, bigint, and RLP cases use the inputs from the
[Alloy benchmark suite](https://github.com/alloy-rs/examples/tree/main/benches).
The dynamic Uniswap case parses its JSON ABI inside every measured call.
Provider engines do not override bigint arithmetic or RLP encoding, so small
differences among `ox`, `ox/node`, and `ox/wasm` in those rows are runtime
noise.

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

Ox 0.14.33 does not expose the generic `TransactionEnvelope.getSignPayload`
function. That column uses `TxEnvelopeEip1559.getSignPayload`, the equivalent
for the EIP-1559 fixture.

Ox exposes event topic encoding as `AbiEvent.encode`. This benchmark measures
the operation sometimes described as `AbiEvent.encodeTopics`.

These results are a local snapshot, not a performance guarantee. CPU,
JavaScript runtime, OpenSSL, WASM runtime, inputs, and background load can
change both timings and rankings. For lower-level cryptographic measurements,
see [WASM and engine benchmarks](/guides/engine#benchmarks).
