---
title: Migrating Tempo multisig accounts
description: Update multisig signatures, account derivation, delegation, and simulation for configurable accounts.
---

# Migrating Tempo multisig accounts

This guide covers the configurable-account implementation in [Tempo PR #7581](https://github.com/tempoxyz/tempo/pull/7581), tested against `sha-83f3ccd`.

## Account identity and configuration

Pass the chain's configured recovery factory when deriving an account. There is no default production factory. Existing addresses derived by the old algorithm differ from the new CREATE2 addresses.

```ts
const account = MultisigConfig.getAddress(genesisConfig, { factory })
const config = MultisigConfig.from({ ...genesisConfig, version: 0n })
```

Configurations support at most 48 owners. Versions use `bigint` and fit in an unsigned 64-bit integer. The initial version is `0n`; rotation increments it. Keep the account address after rotation and supply the updated configuration when signing.

## Signatures

Every signature includes the account, current configuration, and primitive owner approvals. Bootstrap no longer uses a separate `init` field. The node validates the supplied configuration against the account's stored commitment.

```ts
const digest = MultisigConfig.getSignPayload({
  payload,
  account,
  version: config.version ?? 0n,
})
// Sign digest with the configured owners, then order their approvals.
const ordered = SignatureEnvelope.sortMultisigApprovals({
  payload,
  account,
  version: config.version ?? 0n,
  signatures,
})
const signature = SignatureEnvelope.from({ account, config, signatures: ordered })
```

Owner approvals must use secp256k1, P256, or WebAuthn. Nested multisig approvals and `maxNestingDepth` have been removed. An approval over an earlier config version cannot authorize a later version.

Serialized signatures use `0x05 || rlp([account, config, signatures])`. RPC uses those RLP bytes **without** the `0x05` prefix. Use `SignatureEnvelope.toRpc` and `fromRpc` instead of constructing the old structured RPC objects.

## Delegation

A multisig account can authorize another multisig as an access key. Use `type: 'multisig'` in the key authorization, bind the grant to the parent `account`, and sign the grant with the parent's owner quorum. The parent binding is preserved even when `isAdmin` is omitted.

The delegate signs transactions through a keychain V2 envelope. Rotating the delegate's owners preserves its account address and existing grant; later signatures carry the delegate's new configuration.

## Simulation

Replace `multisigInit` and `multisigSignatureCount` with a full configuration and explicit owner approvals:

```ts
const request = TransactionRequest.toRpc({
  from: account,
  calls,
  multisigSimulation: {
    config: Rlp.fromHex(MultisigConfig.toTuple(config)),
    approvals: config.owners.slice(0, 2).map(({ owner }) => ({
      owner,
      keyType: 'secp256k1',
    })),
  },
})
```

Choose enough owners to meet the configuration's threshold. For a delegated transaction, `multisigSimulation` describes the delegate named by `keyId`. Use `keyAuthorizationSimulation` for the independent parent quorum authorizing an attached grant. Omitting an approval's `keyType` models a maximum-size WebAuthn signature.
