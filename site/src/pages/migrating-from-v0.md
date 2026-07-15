---
description: "Migrate applications from Ox v0 to v1."
---

# Migrating from v0

Ox v1 includes breaking changes to decoded addresses, cryptographic values, blob handling, and Tempo types. This guide covers every breaking change and the migration required for each one.

First, upgrade Ox to v1.

:::code-group
```bash [pnpm]
pnpm add ox@^1
```

```bash [npm]
npm install ox@^1
```

```bash [yarn]
yarn add ox@^1
```

```bash [bun]
bun add ox@^1
```
:::

## ABI addresses are checksummed

ABI decode functions now checksum decoded addresses by default. If your application compares decoded addresses as case-sensitive strings, normalize both sides or pass `checksumAddress: false` to preserve the v0 behavior.

```ts
const values = AbiParameters.decode(parameters, data) // [!code --]
const values = AbiParameters.decode(parameters, data, { // [!code ++]
  checksumAddress: false, // [!code ++]
}) // [!code ++]
```

The option is also available on the higher-level ABI decode functions that return addresses.

## Cryptographic coordinates use padded hex

ECDSA and BLS coordinate fields now use padded `Hex.Hex` strings instead of `bigint`. This includes `r`, `s`, `x`, `y`, and BLS `Fp`/`Fp2` values on `Signature`, `PublicKey`, `BlsPoint`, `Transaction`, `Authorization`, `TxEnvelope`, and related Tempo and ERC types.

ECDSA coordinates are 32 bytes. BLS12-381 coordinates are 48 bytes. The `bigintType` generic has been removed.

```ts
const signature = Signature.from({ // [!code --]
  r: 0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bfn, // [!code --]
  s: 0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8n, // [!code --]
  yParity: 1, // [!code --]
}) // [!code --]
const signature = Signature.from({ // [!code ++]
  r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf', // [!code ++]
  s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8', // [!code ++]
  yParity: 1, // [!code ++]
}) // [!code ++]
```

Use `Hex.fromNumber(value, { size: 32 })` for ECDSA values and `Hex.fromNumber(value, { size: 48 })` for BLS12-381 values when migrating stored bigints.

## Noble and Scure dependencies use v2

Ox now uses v2 of `@noble/ciphers`, `@noble/curves`, `@noble/hashes`, `@scure/bip32`, and `@scure/bip39`.

ECDSA signatures now default to `lowS: true` for both `Secp256k1` and `P256`. In v0, `P256` signatures could have high-S values.

If you use the `noble` re-exports on `Secp256k1`, `P256`, `Ed25519`, `X25519`, or `Bls`, migrate to the noble v2 API. Notable renames include:

| v0 | v1 |
| --- | --- |
| `ProjectivePoint` or `ExtendedPoint` | `Point` |
| `bls.sign` and `bls.verify` | `bls.longSignatures.sign` and `bls.longSignatures.verify` |

Refer to the relevant noble and Scure v2 changelogs for the complete upstream API changes.

## PeerDAS replaces blob sidecars

The EIP-4844 blob-sidecar API has been removed in favor of PeerDAS (EIP-7594).

- `Kzg.Kzg` no longer includes `computeBlobKzgProof`.
- `Blobs.toSidecars`, `Blobs.toProofs`, and `Blobs.sidecarsToVersionedHashes` have been removed.
- `Blobs.BlobSidecar` and `Blobs.BlobSidecars` have been removed.
- `TxEnvelopeEip4844.sidecars` and the legacy network-wrapper serialization have been removed.

Use a PeerDAS-capable KZG backend. It must provide `blobToKzgCommitment`, `computeCells`, `computeCellsAndKzgProofs`, `recoverCellsAndKzgProofs`, and `verifyCellKzgProofBatch`.

Use `BlobCells` to construct and verify cells and data columns.

```ts
const sidecars = Blobs.toSidecars(blobs, { kzg }) // [!code --]
const versionedHashes = Blobs.sidecarsToVersionedHashes(sidecars) // [!code --]
const columns = BlobCells.toDataColumns(blobs, { kzg }) // [!code ++]
const versionedHashes = Blobs.toVersionedHashes(blobs, { kzg }) // [!code ++]
```

`Kzg.Kzg.blobToKzgCommitment` and `Blobs.toVersionedHashes` remain available for transaction versioned-hash derivation.

## Tempo addresses use plain hex

The `TempoAddress` module and its `tempox`-prefixed address format have been removed. Tempo modules now accept plain `Address.Address` hex values.

Remove calls to `TempoAddress.format`, `TempoAddress.parse`, and `TempoAddress.resolve` at application boundaries. The `addressType` generic has also been removed from `Call`, `TxEnvelopeTempo`, `KeyAuthorization`, `AuthorizationTempo`, and `TransactionRequest`.

```ts
import { TempoAddress } from 'ox/tempo' // [!code --]

const formatted = TempoAddress.format(address) // [!code --]
const { address: resolved } = TempoAddress.parse(formatted) // [!code --]
const resolved = address // [!code ++]
```

## Tempo tokens use addresses

The Tempo `TokenId` module has been removed. `feeToken`, `Channel.token`, and the token arguments passed to `PoolId.from` now accept `Address.Address` values instead of numeric token IDs.

```ts
const envelope = TxEnvelopeTempo.from({
  // ...
  feeToken: 1n, // [!code --]
  feeToken: '0x20c0000000000000000000000000000000000001', // [!code ++]
})
```

`Channel.Resolved` has also been removed. Use `Channel.Channel` with address-valued token fields.

## Tempo multisig no longer uses `config_id`

TIP-1061 multisig account addresses now derive directly from the initial configuration. `MultisigConfig.toId` and the `genesisConfigId` fields have been removed.

```ts
const id = MultisigConfig.toId(genesisConfig) // [!code --]
const account = MultisigConfig.getAddress({ genesisConfigId: id }) // [!code --]
const account = MultisigConfig.getAddress(genesisConfig) // [!code ++]

const payload = MultisigConfig.getSignPayload({ // [!code --]
  payload: transactionPayload, // [!code --]
  account, // [!code --]
  genesisConfigId: id, // [!code --]
}) // [!code --]
const payload = MultisigConfig.getSignPayload({ // [!code ++]
  payload: transactionPayload, // [!code ++]
  account, // [!code ++]
}) // [!code ++]

const envelope = SignatureEnvelope.from({ // [!code --]
  account, // [!code --]
  genesisConfigId: id, // [!code --]
  signatures, // [!code --]
}) // [!code --]
const envelope = SignatureEnvelope.from({ account, signatures }) // [!code ++]
```

Owner approval digests now bind only the account. The signature wire format is `0x05 || rlp([account, signatures, init?])`, `MultisigConfig.maxOwners` is 255 with `u8` weights, and owner approvals may contain nested multisig signatures.

## RPC schema codecs return native quantities

The `ox/zod` RPC schema codecs now decode scalar quantity results to native values. Balance, gas, fee, and block-number quantities decode to `bigint`; chain IDs, transaction counts, and block transaction counts decode to `number`.

Use `RpcSchema.FromZod` when you need the raw JSON-RPC wire types. Use the codec return types when consuming decoded values.

## Transaction envelope type detection expects native types

`TransactionEnvelope.getType` now rejects RPC-style type strings such as `'0x0'` through `'0x4'`. Convert RPC transaction requests before detecting their envelope type.

```ts
const type = TransactionEnvelope.getType(rpcRequest) // [!code --]
const request = TransactionRequest.fromRpc(rpcRequest) // [!code ++]
const type = TransactionEnvelope.getType(request) // [!code ++]
```

## Stricter validation

Ox v1 rejects malformed values that v0 sometimes accepted or normalized. Audit code that relies on permissive parsing, particularly for:

- undersized ABI data, invalid packed-array lengths, and anonymous event topics;
- weak or invalid keystore KDF parameters;
- malformed public keys, blooms, typed data, COSE keys, values, RLP, and JSON-RPC responses;
- non-32-byte access-list storage keys;
- EIP-4844 envelopes without `blobVersionedHashes`; and
- invalid WebAuthn assertion flags or extension data.

See the [v1.0.0 changelog](https://github.com/wevm/ox/blob/main/CHANGELOG.md#100) for the full list of corrected validation and serialization behavior.
