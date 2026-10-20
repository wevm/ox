# Plan: sync ox configurable accounts with Tempo main

Status: proposed · Owner: jxom · Last reviewed: 2026-10-20

Bring `ox/tempo` configurable-account APIs up to date with Tempo main and the
current TIP cluster, and add TIP-1113 in-place migration helpers. viem depends
on this work (`ox@0.14.56`), so ox goes first and every fix ships on both
`main` (1.x) and `0.x`.

## Sources of truth

Newest first. When they disagree, prefer the spec and main over the open
implementation PRs.

| Source | What it settles |
| --- | --- |
| [tempoxyz/tempo#7510](https://github.com/tempoxyz/tempo/pull/7510) (TIP-1107–1114) | Spec: domains, encodings, migration, T14 gate |
| Tempo main `20c4412` ([#8502](https://github.com/tempoxyz/tempo/pull/8502), [#8497](https://github.com/tempoxyz/tempo/pull/8497)) | Rust constants and test vectors under the new names |
| `crates/primitives/src/transaction/configurable_account/mod.rs` | Domain constants, limits, `CONFIGURABLE_ACCOUNT_UPGRADE_DOMAIN` |
| `crates/primitives/tests/configurable_account.rs` (`configurable_account_hashes_follow_vectors_and_documented_layout`) | Byte-exact vectors to pin in ox tests |
| `crates/contracts/src/precompiles/configurable_account.rs` | `IConfigurableAccount` ABI, including `upgradeAccount` / `AccountUpgraded` |
| [tempoxyz/tempo#8204](https://github.com/tempoxyz/tempo/pull/8204) (TIP-1137) | Admin access keys removed at T14 |
| Open impl PRs [#7577](https://github.com/tempoxyz/tempo/pull/7577), [#7579](https://github.com/tempoxyz/tempo/pull/7579), [#7581](https://github.com/tempoxyz/tempo/pull/7581), [#7894](https://github.com/tempoxyz/tempo/pull/7894), [#8183](https://github.com/tempoxyz/tempo/pull/8183), [#8486](https://github.com/tempoxyz/tempo/pull/8486) | RPC wire names. These still use "multisig" naming and have not been rebased onto #8502. |

## Current state

- ox was last synced in `42a84e6` (#508, Oct 12). That predates Tempo's
  domain and ABI renames (Oct 20).
- The byte layouts, limits, `0x05` envelope, CREATE2 derivation and init-code
  hash all match main. The domain strings are the only hashing difference.
- ox has no TIP-1113 migration support.

## Phase 1: hashing domains (breaking)

`src/tempo/AccountConfig.ts:36,39,46` uses `tempo:multisig:{account,config,signature}`.
Main uses `tempo:configurable-account:{account,config,signature}`. Every
`getAddress`, `getCommitment`, `getSignPayload` and `AccountOperation.getHash`
result is wrong against the node.

Tasks:
- Rename `accountDomain`, `configDomain` and `signatureDomain` to the
  `tempo:configurable-account:*` strings.
- Update the TSDoc preimage descriptions at `AccountConfig.ts:439` and `:490`.
- Rename `recoveryWalletInitCodeHash` (`:42`) to `accountProxyInitCodeHash`. Keep
  the value `0x583cc6…`, and note that it is a placeholder until TIP-1110
  fixes the canonical account proxy.
- Replace the commitment, address and digest snapshots in `AccountConfig.test.ts`
  and `AccountOperation.test.ts`. Also add a test that pins the Rust vectors
  (factory `0x99…99`, owner `0x11…11`, weight 1, threshold 1, zero salt):
  - account salt `0x641ad6eccc3adf35fac828d5cbb727e2489c904a905420e794e8275b6150bfe1`
  - address `0x87c346a9029d675f296db533b12e146439cf20d5`
  - v0 commitment `0x79cc3a5fcbe18cb8cbbd2b41393750ccf3bbc20533a846755767fa10068ae01d`
  - v0 digest (inner `0x42…42`, account `0x91847576f406d0842ad7c1a0c97c22a122e64278`)
    `0xe6fa513b5ab32da6f116443f13191096bce77b4850f4d51f3aa436fa7650c964`
  - v1 digest `0x285c850cb2803beb10f2f212dac73784a1a03b3991ba79081b24bfa91beb9182`
  - v1 commitment `0xee570a0f26f17b41cdf0952a04ee01ea23495b0c0a59f9c904b0d60cb76453c3`
  - 48 owners of weight 1, threshold 8 → `0x7a4279bb3f1b8b54d703484317f64eae6814e827`
- Add a changeset (major on `main`, patch on `0.x`). It must say that
  addresses, commitments and approval digests change.

Done when: the new vector test passes, and
`pnpm test --project tempo-unit --bail=1` and `pnpm check:types` are green.

## Phase 2: TIP-1113 migration helpers (new API)

Migration needs no new signature format. The root key signs an ordinary `0x76`
transaction whose only call is
`upgradeAccount(uint8 threshold, (address owner, uint8 weight)[] owners)` on
`0xAACC000000000000000000000000000000000000`. The resulting account config is
`{ salt: keccak256("tempo:configurable-account:upgrade" || account), version: 1, threshold, owners }`.

Tasks in `src/tempo/AccountConfig.ts`:
- Add a private `upgradeDomain = 'tempo:configurable-account:upgrade'`.
- Add `getUpgradeSalt(account)`, which returns `keccak256(upgradeDomain || account20)`.
- Add `fromUpgrade(account, { owners, threshold })`, which returns
  `from({ salt: getUpgradeSalt(account), version: 1n, owners, threshold })`
  with owners sorted and validated. The root may appear as an owner, because
  self-ownership is only rejected at version 0.
- Add TSDoc examples. Add tests that cross-check the salt and commitment
  against #8183's node test `crates/node/tests/it/tempo_transaction/multisig/migration.rs`,
  after re-deriving them with the new domains.

Optional in `src/tempo/TxEnvelopeTempo.ts` or `TransactionRequest.ts`:
- Add `assertUpgrade(envelope)`, which checks the transaction is valid for
  migration: exactly one call to `0xAACC…` with selector `0x5f5fdc31`, no
  `keyAuthorization`, an empty `authorizationList`, and, if signed, a
  primitive signature (`secp256k1`, `p256` or `webAuthn`). A fee payer is
  allowed.

Out of scope for ox: the ABI and the actions. Those belong in viem.

Done when: the new exports have TSDoc and tests, `pnpm zile examples:check`
passes, and a changeset exists (minor).

## Phase 3: TIP-1137 admin access keys

At T14, `is_admin = true` and admin-signed `key_authorization` are invalid.
Configurable accounts only exist from T14, so they can never use admin keys.

Tasks:
- `KeyAuthorization.ts:50,116`: mark `isAdmin` `@deprecated` (removed from T14
  per TIP-1137). Leave encode and decode in place for pre-T14 chains.
- Add a check that rejects `isAdmin: true` when the authorizing account is
  configurable, wherever ox can tell (a sign payload with a configurable
  `account` binding).

## Phase 4: correctness nits against the node

- **Configurable grants without `account`:** `KeyAuthorization.ts:1218-1223`
  (reached from `deserialize`) and zod `KeyAuthorization.ts:50` throw
  `MissingAccountError` for a configurable `keyType` with no `account`. The
  node only checks the binding when one is present, so ox should accept these
  grants. Verify against #7581's `validate_authorization_for_account` before
  changing.
- **Simulation `keyData`:** `AccountSimulation.ts:170-174` (`shimKeyData`) passes
  any value up to 4 bytes through unchanged. The node rejects owner-approval
  hints that are not 1, 2 or 4 bytes. Throw `InvalidSimulationError` for 0
  or 3 bytes.

## Phase 5: e2e infrastructure

- `test/tempo/setup.global.configurableAccounts.ts:19`: rename the genesis key
  `multisigRecoveryFactory` to `configurableAccountRecoveryFactory`.
- `test/tempo/configurableAccounts.genesis.json`: add `t14Time`.
- `test/tempo/configurableAccounts.ts:3`: replace image `sha-83f3ccd` with a
  build that has the new domains and T14 integration.

**Blocked:** main does not accept configurable-account signatures in
transactions yet. The only integration branches, #7581 and #7894, still use
the old domains. Until one of them rebases onto #8502, the e2e suite cannot
pass with Phase 1 applied. Either skip the configurable e2e project in CI
with a link to the tracking PR, or build a local image from a rebased
integration branch. Do not reintroduce the old domains to keep e2e green.

## Phase 6: deferred until the Tempo PRs rebase

Track these. Do not change them before the node does.

- **RPC key type name:** ox maps `configurable` to the wire value `'multisig'`
  (`TransactionRequest.ts:73-75,150,295`; `KeyAuthorization.ts:119-120,554,1011`;
  zod `TransactionRequest.ts:29-34`, `KeyAuthorization.ts:40,50`). TIP-1111
  names it `ConfigurableAccount = 3`, and #8502 says there will be no aliases.
  Expect the wire value to become `configurableAccount`. When it does, decide
  whether to accept both values for one release.
- **Simulation field:** `multisigSimulation` is likely to become
  `configurableAccountSimulation` or `accountSimulation`.
- **Account proxy hash:** the init-code hash will change when TIP-1110 is
  final, which changes every derived address again.
- **Reserved-address checks:** TIP-1110 also rejects derived addresses that are
  virtual addresses, active precompiles, TIP-20 or ZonePortal addresses. Main
  leaves this to callers, so it is low priority. Consider an
  `AccountConfig.getAddress` option or a separate `assertAddress`.
- **TIP-1108 account `extension`:** add an optional `extension`
  (`0x00 || configHash`, 33 bytes) to the `eth_getAccount` /
  `eth_getAccountInfo` schemas once the RPC lands.
- **TIP-1142 passport signers:** owner approvals may need to accept the
  TIP-1131 ZK signature type (`SignatureEnvelope.ts:735-736`).

## Release and backport

1. Land Phases 1–4 on `main` (1.x) in one PR, or as Phase 1 followed by
   Phases 2–4.
2. Cherry-pick the same commits onto `0.x` in a `jxom/<topic>-v0` branch
   (following the existing `*-v0` convention) and release `0.14.57`.
3. Hand off to the viem plan (`viem/.agents/plans/configurable-accounts-tempo-sync.md`),
   which bumps to that release.

## Open questions

- Activation: #7510 says T14. #8182 and #8183 add a separate
  `accountMigrationTime` and a `MigrationNotActive` error. ox should not encode
  availability. Confirm which one Tempo keeps.
- Wire names: confirm the final `keyType` and simulation field names with
  joshieDo before Phase 6.
- Whether ox should ship the `IConfigurableAccount` ABI and address constant,
  or leave them to viem (today they only appear inline in
  `configurableAccounts.e2e.test.ts`).
