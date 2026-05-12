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

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |

---

## abi

_Abi, AbiConstructor, AbiError, AbiEvent, AbiFunction, AbiItem, AbiParameters._

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
