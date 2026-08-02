# Ox Guides — Proposed Information Architecture

> **Status:** Draft for review
> **Scope:** Refactor of the flat guide list under `site/src/pages/guides/` into a
> use-case-driven `Domain → Topic → Recipes` structure, modeled on the viem v3 docs
> (`v3.viem.sh`). The Tempo section (`/tempo/guides`) already follows this model and is
> the in-repo precedent.

---

## 1. Digest: how viem v3 structures its guides

### 1.1 Three page types

viem v3 (`site/pages/docs/guides/` on the `v3` branch) uses exactly three page shapes:

1. **Guides overview** (`/docs/guides`) — one paragraph of framing ("Task-oriented guides…
   Each guide combines related APIs into a complete workflow and links to the API reference
   for deeper detail.") followed by a `<Cards>` grid, one card per domain with an icon and a
   one-line description.

2. **Domain index** (`/docs/guides/contracts`) — `## Overview` with 2–3 sentences of domain
   framing plus **one canonical code example**, then a `<Cards>` grid linking to each topic
   page in the domain.

3. **Topic page** (`/docs/guides/contracts/read`) — the workhorse. Fixed anatomy:

   ```
   ---
   description: <SEO one-liner>
   ---
   # <Topic Title>            ← imperative, task-oriented ("Read Contracts")

   ## Overview                ← 1–3 sentences; names the primary API and links to its reference

   ## Recipes                 ← optional 1-line preamble stating shared assumptions
   ### <Recipe 1>             ← imperative scenario title ("Read Historical State")
   <one sentence of intent>
   :::code-group              ← example.ts + config file tabs, twoslash, [!code focus]
   ### <Recipe 2>
   …

   ## Best Practices          ← 1–3 H3 guidelines (short, opinionated)

   ## See More                ← <Cards> to 2–3 related topic pages
   ```

### 1.2 Sidebar model

```
Guides
├─ Overview                        → /docs/guides
├─ Blocks & Events      (collapsed group)
│  ├─ Overview                     → /docs/guides/blocks-events
│  ├─ Read & Inspect Blocks        → /docs/guides/blocks-events/read
│  ├─ Watch & Simulate Blocks      → …
│  └─ …
├─ Chain Data           (collapsed)
├─ Clients & Transports (collapsed)
├─ Contract Interactions (collapsed)
├─ EIP-7702 Authorizations (collapsed)
├─ Error Handling       (collapsed)
├─ Extending Viem       (collapsed)
├─ Testing              (collapsed)
├─ Transactions         (collapsed)
└─ Wallets & Accounts   (collapsed)
```

Key properties worth copying:

- **Domains are use-cases, not modules.** "Contract Interactions", "Chain Data" — named for
  what the reader is trying to do, not for the API namespace.
- **Every domain group is `collapsed: true`** and starts with an `Overview` item pointing at
  the domain index. The sidebar stays scannable at ~11 domains.
- **Topic titles are imperative verb phrases** ("Read Contracts", "Prepare & Sign",
  "Query Logs"), not noun dumps.
- **Recipes live *inside* topic pages as `###` headings**, not as separate sidebar entries.
  The sidebar bottoms out at the topic level.
- **File layout mirrors URLs:** `guides/<domain>/<topic>.mdx` + `guides/<domain>/index.mdx`.
- **Guides link to reference, reference links to guides.** Guides never re-document
  parameters; they show workflows and deep-link into the API reference.
- **Shared setup is factored into `snippets/`** and pulled in via `[!include …]` so every
  recipe stays copy-paste-runnable without repeating boilerplate.

### 1.3 What Ox should *not* copy

viem domains like *Clients & Transports*, *Testing (Anvil)*, and *Extending Viem* are
client-library concerns. Ox is a stdlib of stateless primitives — its domains should map to
the underlying protocol/data concepts users are wrangling, with recipes that end at "hand
the payload to your transport" rather than "await the receipt".

---

## 2. Current state of Ox guides

Flat list of 15 pages under `/guides/*`, in a single uncollapsed sidebar block, ordered
quasi-alphabetically:

| Page | Lines | Shape today | Notes |
|---|---|---|---|
| `abi.md` | 594 | Mini-book: params, calls, events, deployment | Overloaded; 4 topics in one page |
| `bytes-hex.md` | 232 | Instantiate / convert / manipulate | Good recipe bones |
| `ecdsa.md` | 312 | Signers + signature/pubkey serialization | Mixes 2 topics |
| `eip-1193.md` | 95 | Provider instantiation examples | |
| `encryption.md` | 78 | AES-GCM 3-step walkthrough | |
| `engine.md` | 441 | WASM/Node/custom engines | Advanced; well-structured |
| `json-rpc.md` | 202 | Request/response/handling | |
| `kzg.md` | 105 | WASM KZG lifecycle | |
| `mnemonics.md` | 75 | Generate / derive keys | |
| `rlp.md` | 54 | Encode/decode | Thin |
| `signed-data.md` | 182 | Personal messages + typed data | Mixes 2 topics |
| `siwe.md` | 156 | Full SIWE flow | **Orphaned — not in the sidebar at all** |
| `transaction-envelopes.md` | 200 | Construct/sign/serialize/send | Good bones |
| `webauthn.md` | 135 | Register/derive/sign/verify | |
| `zod.md` | 194 | Schema usage | |

Problems the refactor solves:

- **No grouping** — ABI encoding sits next to AES-GCM encryption next to Zod.
- **Coverage gaps** — no guides at all for: Blobs/EIP-4844, EIP-7702 `Authorization`,
  ERC-4337 `UserOperation`, ERC-7821, ERC-8021, ERC-6492/8010 signatures, `Block`/`Log`/
  `Filter`/`Bloom`, `AccountProof`/`BinaryStateTree`, ENS, `Value`/`Fee`, `Keystore`,
  Base58/Base64/Bech32m/CBOR, Ed25519/X25519, BLS, ML-DSA-44, `TypedData` beyond signing,
  `StateOverrides`/`BlockOverrides`, PRF.
- **Uneven altitude** — some pages are module tours, some are use-case walkthroughs.
- **Orphaned content** (`siwe.md`) and split-brain pages (`ecdsa.md`, `signed-data.md`,
  `abi.md`).
- **Inconsistency with the Tempo section**, which already ships the target IA
  (domain `index.mdx` with Cards → topic pages with recipe `###` sections).

---

## 3. Proposed IA

### 3.1 Principles

1. **Domain → Topic → Recipes.** Sidebar bottoms out at topics; recipes are `###` sections
   on topic pages. Mirrors viem v3 and the existing Ox Tempo guides.
2. **Real-world first.** Every topic page opens with the job to be done; every recipe is a
   scenario someone actually has ("Decode a revert reason from `eth_call`"), not an API tour
   ("`AbiError.decode`").
3. **Every public module has a home.** Each core module and entrypoint maps to exactly one
   *primary* topic (see coverage matrix, §6); cross-cutting modules get cross-links, not
   duplicate content.
4. **Preserve existing content.** Every current guide maps into the new tree (see §5);
   refactoring is mostly *splitting and re-titling*, not rewriting. Existing code examples
   are carried over.
5. **Stdlib altitude.** Recipes end at the primitive's boundary (a signed envelope, an
   encoded payload, a verified signature). Where a full app flow needs a client, link out to
   viem — same convention the Tempo guides use today.
6. **Fixed page anatomy** (§4) so pages are predictable and cheap to author/generate.

### 3.2 Proposed sidebar

URL scheme: `/guides/<domain>/<topic>`, files at `site/src/pages/guides/<domain>/<topic>.mdx`.

```
Guides
├─ Overview                                  /guides
│
├─ Data & Encoding                (collapsed)
│  ├─ Overview                               /guides/data
│  ├─ Work with Bytes & Hex                  /guides/data/bytes-hex
│  ├─ Encode with RLP                        /guides/data/rlp
│  ├─ Base & Binary Encodings                /guides/data/encodings
│  ├─ Serialize JSON Safely                  /guides/data/json
│  └─ Format Ether & Gwei Values             /guides/data/value
│
├─ ABIs & Contracts               (collapsed)
│  ├─ Overview                               /guides/abi
│  ├─ Work with ABIs                         /guides/abi/abis
│  ├─ Encode & Decode Function Calls         /guides/abi/function-calls
│  ├─ Decode Events & Logs                   /guides/abi/events
│  ├─ Decode Reverts & Custom Errors         /guides/abi/errors
│  └─ Deploy Contracts & Compute Addresses   /guides/abi/deployment
│
├─ Transactions                   (collapsed)
│  ├─ Overview                               /guides/transactions
│  ├─ Build, Sign & Send                     /guides/transactions/build-sign-send
│  ├─ Choose an Envelope Type                /guides/transactions/envelope-types
│  ├─ Parse & Inspect Transactions           /guides/transactions/parse-inspect
│  ├─ Estimate Fees & Access Lists           /guides/transactions/fees-access-lists
│  ├─ Send Blob Transactions (EIP-4844)      /guides/transactions/blobs
│  └─ Delegate with EIP-7702                 /guides/transactions/eip-7702
│
├─ Accounts & Keys                (collapsed)
│  ├─ Overview                               /guides/accounts
│  ├─ Derive & Validate Addresses            /guides/accounts/addresses
│  ├─ Mnemonics & HD Wallets                 /guides/accounts/mnemonics-hd
│  └─ Encrypt Keys with Keystores            /guides/accounts/keystores
│
├─ Cryptography                   (collapsed)
│  ├─ Overview                               /guides/crypto
│  ├─ Hash Data                              /guides/crypto/hashing
│  ├─ Sign with ECDSA (secp256k1)            /guides/crypto/ecdsa
│  ├─ Sign with P-256 & WebCrypto            /guides/crypto/p256
│  ├─ Ed25519 & X25519                       /guides/crypto/ed25519-x25519
│  ├─ BLS Signatures & Aggregation           /guides/crypto/bls
│  ├─ Post-Quantum Signatures (ML-DSA)       /guides/crypto/ml-dsa
│  ├─ Encrypt Data (AES-GCM)                 /guides/crypto/encryption
│  └─ Convert Signature Formats              /guides/crypto/signatures
│
├─ Messages & Authentication      (collapsed)
│  ├─ Overview                               /guides/messages
│  ├─ Sign Personal Messages (EIP-191)       /guides/messages/personal-messages
│  ├─ Sign Typed Data (EIP-712)              /guides/messages/typed-data
│  ├─ Sign-In with Ethereum (SIWE)           /guides/messages/siwe
│  └─ Smart Account Signatures (6492/8010)   /guides/messages/smart-account-signatures
│
├─ WebAuthn & Passkeys            (collapsed)
│  ├─ Overview                               /guides/webauthn
│  ├─ Register & Authenticate Credentials    /guides/webauthn/credentials
│  ├─ Sign & Verify with Passkeys            /guides/webauthn/signing
│  └─ Derive Secrets with PRF                /guides/webauthn/prf
│
├─ JSON-RPC & Providers           (collapsed)
│  ├─ Overview                               /guides/rpc
│  ├─ Send JSON-RPC Requests                 /guides/rpc/requests
│  ├─ Type-Safe RPC Schemas                  /guides/rpc/schemas
│  ├─ Use EIP-1193 Providers                 /guides/rpc/providers
│  └─ Serve & Handle RPC Requests            /guides/rpc/handling
│
├─ Chain Data & State             (collapsed)
│  ├─ Overview                               /guides/chain-data
│  ├─ Decode Blocks & Receipts               /guides/chain-data/blocks
│  ├─ Query Logs, Filters & Bloom            /guides/chain-data/logs-filters
│  ├─ Verify State & Account Proofs          /guides/chain-data/proofs
│  ├─ Simulate with State Overrides          /guides/chain-data/overrides
│  └─ Resolve ENS Names                      /guides/chain-data/ens
│
├─ Account Abstraction            (collapsed)
│  ├─ Overview                               /guides/account-abstraction
│  ├─ Build ERC-4337 User Operations         /guides/account-abstraction/user-operations
│  ├─ Batch Calls with ERC-7821              /guides/account-abstraction/erc-7821
│  └─ Attribute Calldata with ERC-8021       /guides/account-abstraction/erc-8021
│
├─ Runtime & Performance          (collapsed)
│  ├─ Overview                               /guides/runtime
│  ├─ WASM & Engines                         /guides/runtime/engines
│  ├─ WASM KZG                               /guides/runtime/kzg
│  └─ Caching & Bundle Size                  /guides/runtime/caches-bundle
│
└─ Schemas & Validation           (collapsed)
   ├─ Overview                               /guides/schemas
   └─ Validate with Zod                      /guides/schemas/zod
```

12 domains, 47 topic pages (+13 index pages). Tempo guides stay where they are
(`/tempo/guides`) — they already conform — and get a card on the `/guides` overview
pointing across.

### 3.3 Domain-by-domain breakdown

Each table lists topic pages with their recipe sections, the modules covered, and where
existing content comes from. Recipes marked **(new)** have no existing prose; everything
else is lifted/split from a current guide.

#### Data & Encoding — `/guides/data`

*Index framing:* "Ox's primitive types — `Hex` and `Bytes` — and the codecs that move data
between wire formats."

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Work with Bytes & Hex | Instantiate from primitives · Convert between types · Concatenate, pad, slice & trim · Compare & validate · Generate random bytes | `Bytes`, `Hex` | `bytes-hex.md` (whole) |
| Encode with RLP | Encode nested data · Decode to Hex/Bytes | `Rlp` | `rlp.md` (whole) |
| Base & Binary Encodings | Base64-encode calldata for URLs **(new)** · Base58 for interop **(new)** · Bech32m addresses **(new)** · CBOR encode/decode **(new)** · Bitcoin CompactSize varints **(new)** | `Base32`, `Base58`, `Base64`, `Bech32m`, `Cbor`, `CompactSize` | new |
| Serialize JSON Safely | Parse responses with bigints **(new)** · Stringify without precision loss **(new)** · Canonicalize for hashing/signing **(new)** | `Json` | new (API examples exist in reference) |
| Format Ether & Gwei Values | Parse user input to wei **(new)** · Format wei for display **(new)** · Custom decimals (tokens) **(new)** | `Value` | new |

#### ABIs & Contracts — `/guides/abi`

*Index framing:* "Everything between your app and a contract's bytecode: parsing ABIs,
encoding calls, decoding what comes back."

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Work with ABIs | Use human-readable ABIs · Parse a JSON ABI · Format back to human-readable · Extract items & compute selectors | `Abi`, `AbiItem`, `AbiParameter`, `Solidity` | `abi.md` §"Human-readable ABIs" |
| Encode & Decode Function Calls | Encode a read call & decode the result · Encode a state-modifying call · Decode incoming calldata (router/inspector) **(new)** · Encode/decode standalone parameters · Packed encoding (`encodePacked`) **(new)** | `AbiFunction`, `AbiParameters` | `abi.md` §"Function Calls", §"Encoding/Decoding" |
| Decode Events & Logs | Build an event filter · Decode a log against an event · Handle indexed vs non-indexed args **(new)** | `AbiEvent` (+ `Log`, `Filter` cross-link) | `abi.md` §"Event Filtering" |
| Decode Reverts & Custom Errors | Decode revert data from `eth_call` **(new)** · Match an error by selector **(new)** · Encode errors for testing **(new)** | `AbiError` | new |
| Deploy Contracts & Compute Addresses | Encode constructor arguments · Compute a CREATE address **(new)** · Compute a CREATE2 address **(new)** | `AbiConstructor`, `ContractAddress` | `abi.md` §"Deployment" |

#### Transactions — `/guides/transactions`

*Index framing:* "Construct, sign, serialize, and inspect every Ethereum transaction type —
no client required."

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Build, Sign & Send | Construct an EIP-1559 envelope · Compute the sign payload & sign · Attach the signature & serialize · Broadcast via `eth_sendRawTransaction` · Sign remotely (wallets & signing servers) | `TxEnvelope*`, `Secp256k1`, `RpcTransport` | `transaction-envelopes.md` (whole) |
| Choose an Envelope Type | Legacy · EIP-2930 access lists · EIP-1559 · EIP-4844 blob · EIP-7702 — one recipe each, with a comparison table **(new)** | `TxEnvelopeLegacy`, `…Eip2930`, `…Eip1559`, `…Eip4844`, `…Eip7702`, `TxEnvelope` | split from `transaction-envelopes.md` + new |
| Parse & Inspect Transactions | Deserialize a raw transaction **(new)** · Recover the sender address **(new)** · Convert RPC transactions/receipts to typed objects **(new)** · Prepare a `TransactionRequest` **(new)** | `TxEnvelope`, `Transaction`, `TransactionReceipt`, `TransactionRequest` | new |
| Estimate Fees & Access Lists | Compute effective gas price **(new)** · Estimate maxFeePerGas from fee history **(new)** · Build & serialize access lists **(new)** | `Fee`, `AccessList` | new |
| Send Blob Transactions (EIP-4844) | Turn data into blobs · Compute commitments & proofs · Build a 4844 envelope with sidecars · Verify blob cells (PeerDAS) **(new)** | `Blobs`, `BlobCells`, `Kzg`, `TxEnvelopeEip4844` | new (KZG setup from `kzg.md`) |
| Delegate with EIP-7702 | Sign an authorization · Build a 7702 envelope · Convert authorization lists for RPC **(new)** | `Authorization`, `TxEnvelopeEip7702` | new |

#### Accounts & Keys — `/guides/accounts`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Derive & Validate Addresses | Derive from a private key · Derive from a public key · Checksum & validate · Compare addresses **(new)** | `Address`, `PublicKey` | `mnemonics.md` §"Deriving", `ecdsa.md` |
| Mnemonics & HD Wallets | Generate a random mnemonic · Derive a private key at a path · Derive many accounts (HD paths) · Restore an HD key from seed/extended key **(new)** | `Mnemonic`, `HdKey` | `mnemonics.md` (whole) |
| Encrypt Keys with Keystores | Encrypt a private key (JSON keystore) **(new)** · Decrypt a keystore **(new)** · Choose scrypt vs PBKDF2 **(new)** | `Keystore` | new |

#### Cryptography — `/guides/crypto`

*Index framing:* "The signing curves, hashes, and ciphers Ethereum (and its ecosystem)
runs on — audited implementations, tree-shakable."

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Hash Data | keccak256 for Ethereum hashing **(new)** · sha256 / ripemd160 **(new)** · HMAC & Blake3 **(new)** · Incremental hashing (`create*`) **(new)** | `Hash` | new (snippets exist across guides) |
| Sign with ECDSA (secp256k1) | Create a key pair · Sign a payload · Verify a signature · Recover the signer | `Secp256k1`, `Signature`, `PublicKey` | `ecdsa.md` §"Signers" |
| Sign with P-256 & WebCrypto | Sign with P256 · Verify with WebCrypto (`WebCryptoP256`) · Non-extractable browser keys **(new)** | `P256`, `WebCryptoP256` | `ecdsa.md` (P256 mentions) + new |
| Ed25519 & X25519 | Sign & verify with Ed25519 **(new)** · Derive a shared secret with X25519 **(new)** | `Ed25519`, `X25519` | new |
| BLS Signatures & Aggregation | Sign & verify **(new)** · Aggregate signatures & pubkeys **(new)** · Serialize BLS points **(new)** | `Bls`, `BlsPoint` | new |
| Post-Quantum Signatures (ML-DSA) | Generate keys, sign & verify with ML-DSA-44 **(new)** | `MlDsa44` | new (module landed recently) |
| Encrypt Data (AES-GCM) | Derive a key from a password · Encrypt data · Decrypt data | `AesGcm` | `encryption.md` (whole) |
| Convert Signature Formats | Hex/Bytes ↔ Signature · DER & compact forms · Legacy `v` ↔ `yParity` · RPC & tuple formats | `Signature` | `ecdsa.md` §"Signatures/Serializing" |

#### Messages & Authentication — `/guides/messages`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Sign Personal Messages (EIP-191) | Compute a sign payload & sign · Verify/recover a signer · Sign with a wallet (`personal_sign`) · Intended-validator data (ERC-191 `0x00`) **(new)** | `PersonalMessage`, `ValidatorData` | `signed-data.md` §"Personal Messages" |
| Sign Typed Data (EIP-712) | Define & hash typed data · Sign & verify · Sign with a wallet (`eth_signTypedData_v4`) · Extract the domain **(new)** | `TypedData` | `signed-data.md` §"Typed Data" |
| Sign-In with Ethereum (SIWE) | Generate a nonce · Create the message · Sign it · Validate on the server | `Siwe` | `siwe.md` (whole — currently orphaned) |
| Smart Account Signatures (6492/8010) | Wrap a signature for a counterfactual account (ERC-6492) **(new)** · Verify/unwrap **(new)** · Delegated verification with ERC-8010 **(new)** | `SignatureErc6492`, `SignatureErc8010` | new |

#### WebAuthn & Passkeys — `/guides/webauthn`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Register & Authenticate Credentials | Register a credential · Authenticate an existing credential **(new)** · Verify registration on the server **(new)** | `webauthn/*` (`Credential`, `Registration`, `Authentication`, `Authenticator`), `CoseKey` | `webauthn.md` §"Registering" + new |
| Sign & Verify with Passkeys | Sign a payload · Extract the public key · Verify a signature (client & server) | `WebAuthnP256`, `PublicKey` | `webauthn.md` §"Signing/Verifying" |
| Derive Secrets with PRF | Derive a credential-bound secret **(new)** · Encrypt with a passkey-derived key (PRF + AES-GCM) **(new)** | `Prf`, `AesGcm` | new (cross-links `encryption`) |

#### JSON-RPC & Providers — `/guides/rpc`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Send JSON-RPC Requests | Build a request store · Send over HTTP `fetch` · Parse responses (raise on error) | `RpcRequest`, `RpcResponse`, `RpcTransport` | `json-rpc.md` §"Sending/Parsing" |
| Type-Safe RPC Schemas | Type a transport with a schema · Extend with custom methods **(new)** | `RpcSchema` | `json-rpc.md` + new |
| Use EIP-1193 Providers | Wrap an injected provider · Create a provider from a transport · Emit provider events | `Provider`, `window` entrypoint | `eip-1193.md` (whole) |
| Serve & Handle RPC Requests | Handle requests in a server/worker · Return typed errors **(new)** | `RpcRequest`, `RpcResponse` | `json-rpc.md` §"Handling Requests" |

#### Chain Data & State — `/guides/chain-data`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Decode Blocks & Receipts | Convert an RPC block to a typed object **(new)** · Read consensus withdrawals **(new)** · Convert receipts **(new)** | `Block`, `Withdrawal`, `TransactionReceipt` | new |
| Query Logs, Filters & Bloom | Build log filters **(new)** · Convert RPC logs **(new)** · Pre-check membership with bloom filters **(new)** | `Filter`, `Log`, `Bloom` (+ `AbiEvent` cross-link) | new |
| Verify State & Account Proofs | Fetch & convert `eth_getProof` results **(new)** · Work with Binary State Trees (EIP-7864) **(new)** | `AccountProof`, `BinaryStateTree` | new |
| Simulate with State Overrides | Override balances/code for `eth_call` **(new)** · Override block context **(new)** | `StateOverrides`, `BlockOverrides` | new |
| Resolve ENS Names | Normalize a name · Compute namehash/labelhash · Coin types for multichain addresses **(new)** | `Ens` | new |

#### Account Abstraction — `/guides/account-abstraction`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Build ERC-4337 User Operations | Construct a UserOperation **(new)** · Compute the hash & sign payload **(new)** · Pack for the EntryPoint **(new)** · Convert to/from RPC **(new)** | `erc4337/*` (`UserOperation`, `EntryPoint`, `UserOperationGas`, `UserOperationReceipt`, `RpcSchema`) | new |
| Batch Calls with ERC-7821 | Encode a batch of calls **(new)** · Encode an `execute` payload **(new)** · Decode incoming executions **(new)** | `erc7821/*` (`Calls`, `Execute`) | new |
| Attribute Calldata with ERC-8021 | Append an attribution suffix **(new)** · Parse attribution codes **(new)** | `erc8021/Attribution` | new |

*(EIP-7702 lives under Transactions; the domain index cross-links it.)*

#### Runtime & Performance — `/guides/runtime`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| WASM & Engines | Default engine · Install the WASM engine · Install the Node engine · Selective module installs · Build a custom engine | `Engine`, `node/*`, `wasm/*` | `engine.md` (whole) |
| WASM KZG | Create an instance · Ownership & cleanup · Memory & precomputation | `wasm/Kzg`, `Kzg`, `trusted-setups` | `kzg.md` (whole) |
| Caching & Bundle Size | Clear global caches **(new)** · Measure & minimize bundle impact (links `/imports`) **(new)** | `Caches` | new + existing `/imports` page |

#### Schemas & Validation — `/guides/schemas`

| Topic | Recipes | Modules | Source |
|---|---|---|---|
| Validate with Zod | Import schemas · Decode & encode RPC data · Validate untrusted input · Integer quantity schemas · JSON-RPC method schemas · Custom method schemas | `zod/*` | `zod.md` (whole) |

---

## 4. Page templates

### 4.1 Guides overview (`/guides` → `guides/index.mdx`)

```mdx
---
description: Task-oriented guides for working with Ethereum primitives in Ox.
---
import { Card, Cards } from 'vocs'

# Guides

## Overview
Task-oriented guides for building with Ox. Each guide combines related modules into a
complete workflow and links to the API reference for deeper detail.

<Cards>
  <Card icon="lucide:binary" title="Data & Encoding" description="…" to="/guides/data" />
  … one card per domain, plus a card for Tempo → /tempo/guides …
</Cards>
```

### 4.2 Domain index (`guides/<domain>/index.mdx`)

```mdx
---
description: <domain SEO line>
---
import { Card, Cards } from 'vocs'

# <Domain Title>

## Overview
<2–3 sentences framing the domain>

<one canonical code example (twoslash)>

<Cards>
  <Card … one per topic … />
</Cards>
```

### 4.3 Topic page (`guides/<domain>/<topic>.mdx`)

```mdx
---
description: <topic SEO line>
---
import { Card, Cards } from 'vocs'

# <Imperative Topic Title>

## Overview
<1–3 sentences; name the primary module(s) and link their API reference>

## Recipes

### <Scenario title>
<one sentence of intent>
```ts twoslash
// [!code focus] on the lines that matter
```

### …more recipes…

## Best Practices
### <short opinionated guideline>

## See More
<Cards> → 2–3 related topics (cross-domain encouraged)
```

Conventions carried from viem v3 + existing Ox/Tempo pages:

- `description` frontmatter on every page (Ox derives OG images from it).
- `lucide:*` icons on Cards (already the Tempo convention).
- Twoslash code blocks; `[!code focus]` to highlight the recipe's essence.
- Shared setup goes in `site/src/snippets/` and is pulled with `[!include …]`.
- Deep-link every module mention to its API reference page on first use.

---

## 5. Migration map (old → new)

Every existing URL gets a redirect (vocs `redirects` config / `vercel.json`):

| Old URL | New home(s) |
|---|---|
| `/guides/abi` | `/guides/abi/abis` (+ split into `function-calls`, `events`, `deployment`) |
| `/guides/bytes-hex` | `/guides/data/bytes-hex` |
| `/guides/ecdsa` | `/guides/crypto/ecdsa` (+ `signatures`) |
| `/guides/eip-1193` | `/guides/rpc/providers` |
| `/guides/encryption` | `/guides/crypto/encryption` |
| `/guides/engine` | `/guides/runtime/engines` |
| `/guides/json-rpc` | `/guides/rpc/requests` (+ `handling`) |
| `/guides/kzg` | `/guides/runtime/kzg` |
| `/guides/mnemonics` | `/guides/accounts/mnemonics-hd` |
| `/guides/rlp` | `/guides/data/rlp` |
| `/guides/signed-data` | `/guides/messages/personal-messages` (+ `typed-data`) |
| `/guides/siwe` | `/guides/messages/siwe` (fixes orphan) |
| `/guides/transaction-envelopes` | `/guides/transactions/build-sign-send` (+ `envelope-types`) |
| `/guides/webauthn` | `/guides/webauthn/signing` (+ `credentials`) |
| `/guides/zod` | `/guides/schemas/zod` |

---

## 6. Coverage matrix — every module has a home

Primary guide topic per public module (cross-links not listed):

| Module(s) | Primary topic |
|---|---|
| `Bytes`, `Hex` | data/bytes-hex |
| `Rlp` | data/rlp |
| `Base32`, `Base58`, `Base64`, `Bech32m`, `Cbor`, `CompactSize` | data/encodings |
| `Json` | data/json |
| `Value` | data/value |
| `Abi`, `AbiItem`, `AbiParameter`, `Solidity` | abi/abis |
| `AbiFunction`, `AbiParameters` | abi/function-calls |
| `AbiEvent` | abi/events |
| `AbiError` | abi/errors |
| `AbiConstructor`, `ContractAddress` | abi/deployment |
| `TxEnvelope`, `TxEnvelopeLegacy/Eip2930/Eip1559` | transactions/build-sign-send, envelope-types |
| `Transaction`, `TransactionReceipt`, `TransactionRequest` | transactions/parse-inspect |
| `Fee`, `AccessList` | transactions/fees-access-lists |
| `Blobs`, `BlobCells`, `Kzg`, `TxEnvelopeEip4844` | transactions/blobs |
| `Authorization`, `TxEnvelopeEip7702` | transactions/eip-7702 |
| `Address`, `PublicKey` | accounts/addresses |
| `Mnemonic`, `HdKey` | accounts/mnemonics-hd |
| `Keystore` | accounts/keystores |
| `Hash` | crypto/hashing |
| `Secp256k1` | crypto/ecdsa |
| `P256`, `WebCryptoP256` | crypto/p256 |
| `Ed25519`, `X25519` | crypto/ed25519-x25519 |
| `Bls`, `BlsPoint` | crypto/bls |
| `MlDsa44` | crypto/ml-dsa |
| `AesGcm` | crypto/encryption |
| `Signature` | crypto/signatures |
| `PersonalMessage`, `ValidatorData` | messages/personal-messages |
| `TypedData` | messages/typed-data |
| `Siwe` | messages/siwe |
| `erc6492/SignatureErc6492`, `erc8010/SignatureErc8010` | messages/smart-account-signatures |
| `webauthn/*`, `CoseKey` | webauthn/credentials |
| `WebAuthnP256` | webauthn/signing |
| `Prf` | webauthn/prf |
| `RpcRequest`, `RpcResponse`, `RpcTransport` | rpc/requests, rpc/handling |
| `RpcSchema` | rpc/schemas |
| `Provider`, `window` | rpc/providers |
| `Block`, `Withdrawal` | chain-data/blocks |
| `Log`, `Filter`, `Bloom` | chain-data/logs-filters |
| `AccountProof`, `BinaryStateTree` | chain-data/proofs |
| `StateOverrides`, `BlockOverrides` | chain-data/overrides |
| `Ens` | chain-data/ens |
| `erc4337/*` | account-abstraction/user-operations |
| `erc7821/*` | account-abstraction/erc-7821 |
| `erc8021/Attribution` | account-abstraction/erc-8021 |
| `Engine`, `node/*`, `wasm/*` | runtime/engines |
| `Caches` | runtime/caches-bundle |
| `zod/*` | schemas/zod |
| `Errors` | existing top-level `/error-handling` page (unchanged) |
| `tempo/*` | existing `/tempo/guides` (unchanged) |

Not guide-worthy: `version`, `trusted-setups` (referenced from runtime/kzg).

---

## 7. Open questions

1. **Domain count.** 12 domains is one more than viem's 11. Candidates to merge if we want
   fewer: *Schemas & Validation* (1 topic) could fold into *JSON-RPC & Providers* or stay a
   single sidebar item; *Runtime & Performance* could absorb it as "tooling".
2. **`Engine` naming collision.** `/guides/runtime/engines` is about crypto backends
   (WASM/Node), not the Engine API. Title stays "WASM & Engines" to match current page.
3. **Error handling.** Keep `/error-handling` as a root page (current), or pull it into the
   guides tree as a domain like viem does? Proposal: keep root page, add a card on `/guides`.
4. **Rollout.** Suggested phasing: (1) scaffold tree + move/split existing 15 guides with
   redirects; (2) fill high-value new topics (blobs, 7702, 4337, keystores, errors/reverts);
   (3) long-tail new topics (BLS, ML-DSA, proofs, bloom, ENS).
5. **Snippet strategy.** Introduce `site/src/snippets/guides/` for shared setup (transport
   config, test keys) so recipes stay copy-paste-runnable like viem's `viem.config.ts` tabs.
