# Bench Results

Aggregated bench numbers for Track B (perf foundations). See [`README.md`](./README.md) for the convention.

Baseline is `origin/v1` at the SHA noted per row. Each row records: bench name, baseline ops/s, PR ops/s, delta (`%` faster), PR commit SHA.

Append new rows beneath the relevant area heading. Keep one bench per line. Do not reorder areas; new areas go at the end.

| Field      | Notes                                              |
| ---------- | -------------------------------------------------- |
| bench      | `<file>::<describe>::<bench name>`                 |
| baseline   | ops/s on `origin/v1` at `<baseline SHA>`           |
| PR         | ops/s on the PR branch at `<PR SHA>`               |
| delta      | `(PR / baseline) - 1`, signed percentage           |
| SHA        | PR commit recording the measurement                |

---

## foundations

_Bytes, Hex, Hash, Rlp._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## encoding

_Cbor, Json, CompactSize, Base32 / Base58 / Base64, Bech32m._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## transactions

_TxEnvelope*, AccessList, Authorization, Withdrawal, Blobs, Transaction*._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## address-keys

_Address, HdKey, Mnemonic, Keystore, Ens, ContractAddress._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## block-state

_Block, Log, Filter, Bloom, Fee, BinaryStateTree, AccountProof, BlockOverrides, StateOverrides, Value._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## crypto

_Secp256k1, P256, Ed25519, X25519, Bls, Hash, AesGcm, Signature, PublicKey, BlsPoint._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## erc

_erc4337, erc6492, erc7821, erc8010, erc8021._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## rpc

_Provider, RpcRequest, RpcResponse, RpcSchema, RpcTransport, Caches, Errors._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## tempo

_All `src/tempo/*` modules._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## webauthn

_`src/webauthn/*`, CoseKey, WebCryptoP256, WebAuthnP256._

Baseline: `94d3e4bc`. PR: `8e907a32` (track-b/webauthn).

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Authentication.bench.ts::Authentication.sign (mock)::default` | 444,389 | 516,057 | +16.1% | `8e907a32` |
| `Authentication.bench.ts::Authentication.verify::default` | 691.51 | 825.25 | +19.3% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (no credential)::hex output` | 541,646 | 646,294 | +19.3% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (no credential)::bytes output` | n/a (new API) | 1,317,423 | +143.2% vs baseline-hex | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (with credential)::hex output` | 156,125 | 193,553 | +24.0% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (with credential)::bytes output` | n/a (new API) | 189,208 | +21.2% vs baseline-hex | `8e907a32` |
| `Authenticator.bench.ts::getSignCount::from hex` | 1,124,365 | 1,550,874 | +37.9% | `8e907a32` |
| `Authenticator.bench.ts::getSignCount::from bytes` | n/a (new API) | 42,920,355 | +3717.3% vs baseline-hex | `8e907a32` |
| `Registration.bench.ts::Registration.verify (packed)::default` | 629.62 | 782.30 | +24.2% | `8e907a32` |
| `Registration.bench.ts::Registration.verify (none)::default` | 33,542 | 57,800 | +72.3% | `8e907a32` |

Notes:
- `Authentication.sign` is benched against a mocked `getFn` returning the signed fixture; it isolates the host-side parsing and metadata construction work that this phase touched.
- `Authentication.verify` and `Registration.verify (packed)` are bottlenecked by P-256 signature verification; the measured deltas reflect the savings from the bytes-first authenticator-data parsing and (for `Registration.verify`) the single COSE decode.
- `Registration.verify (none)` skips the attestation signature verification, isolating the COSE decode and authData parsing wins.
- `getAuthenticatorData` and `getSignCount` `bytes` rows are new API surface (not present on baseline); compared against the baseline `hex` row for context.

---

## abi

_Abi, AbiConstructor, AbiError, AbiEvent, AbiFunction, AbiItem, AbiParameters._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
