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

Baseline: `94d3e4bc` (origin/v1).

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Rlp_tx.bench.ts::Rlp.fromHex (transaction-shaped)::eip1559 tuple` | 360,488 ops/s | 441,626 ops/s | +22.5% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.fromHex (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 150,945 ops/s | 175,186 ops/s | +16.1% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toHex (transaction-shaped)::eip1559 tuple` | 323,896 ops/s | 325,369 ops/s | +0.5% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toHex (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 139,158 ops/s | 140,680 ops/s | +1.1% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toBytes (transaction-shaped)::eip1559 tuple` | 423,112 ops/s | 302,199 ops/s | -28.6% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toBytes (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 173,571 ops/s | 165,334 ops/s | -4.7% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.serialize::minimal (no access list)` | 475,391 ops/s | 282,563 ops/s | -40.6% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.serialize::with access list (2 entries, 4 storage keys)` | 153,759 ops/s | 136,665 ops/s | -11.1% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.deserialize::minimal (no access list)` | 456,898 ops/s | 258,835 ops/s | -43.4% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.deserialize::with access list (2 entries, 4 storage keys)` | 147,861 ops/s | 111,625 ops/s | -24.5% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.hash::minimal (no access list)` | 168,751 ops/s | 109,894 ops/s | -34.9% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.hash::with access list (2 entries, 4 storage keys)` | 58,327 ops/s | 51,429 ops/s | -11.8% | a57efdb8 |

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

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## abi

_Abi, AbiConstructor, AbiError, AbiEvent, AbiFunction, AbiItem, AbiParameters._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
