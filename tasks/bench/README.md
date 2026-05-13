# Track B Bench Harness

Performance benchmarking infrastructure for the Track B perf-foundations work in [master-plan.md](../master-plan.md).

## Convention

- Benches live next to source as `src/**/*.bench.ts`. They are picked up automatically by the project Vitest config (`benchmark.include` in [`test/vitest.config.ts`](../../test/vitest.config.ts)).
- Run the suite with `pnpm bench`. Append `--run` for a one-shot non-watch invocation.
- Vitest writes the machine readable report to `./.bench/report.json` (gitignored).
- Every Phase 1 PR that claims a perf win MUST add measured numbers to `bench/<scope>.md` for its area. No numbers, no merge.

## Authoring a bench

```ts
// src/core/Foo.bench.ts
import { bench, describe } from 'vitest'
import * as Foo from './Foo.js'

describe('Foo.bar', () => {
  bench('baseline', () => {
    Foo.bar(input)
  })
})
```

Keep fixture construction outside the `bench` callback so it does not pollute timing.

## Recording results

For each PR:

1. Run `pnpm bench --run` on the PR branch and on `origin/v1` (the baseline).
2. Add or update a row in [`bench/<scope>.md`](../../bench) with: bench name, baseline ops/s, PR ops/s, delta (`%` faster), commit SHA.
3. Keep entries terse (one line per bench). Group by file under `## <Module>` headings within the scope file.

Each Phase 1 area owns its own results file under `bench/`:

| Scope | Results | Modules |
| ----- | ------- | ------- |
| foundations | [`bench/foundations.md`](../../bench/foundations.md) | Bytes, Hex, Hash, Rlp leaf primitives |
| encoding | [`bench/encoding.md`](../../bench/encoding.md) | Cbor, Json, CompactSize, Base32 / Base58 / Base64, Bech32m |
| transactions | [`bench/transactions.md`](../../bench/transactions.md) | TxEnvelope*, AccessList, Authorization, Withdrawal, Blobs |
| address-keys | [`bench/address-keys.md`](../../bench/address-keys.md) | Address, HdKey, Mnemonic, Keystore, Ens, ContractAddress |
| block-state | [`bench/block-state.md`](../../bench/block-state.md) | Block, Log, Filter, Bloom, Fee, BinaryStateTree, AccountProof, *Overrides |
| crypto | [`bench/crypto.md`](../../bench/crypto.md) | Secp256k1, P256, Ed25519, X25519, Bls, Hash, AesGcm |
| erc | [`bench/erc.md`](../../bench/erc.md) | erc4337, erc6492, erc7821, erc8010, erc8021 |
| rpc | [`bench/rpc.md`](../../bench/rpc.md) | Provider, Rpc*, Caches, Errors |
| tempo | [`bench/tempo.md`](../../bench/tempo.md) | `src/tempo/*` |
| webauthn | [`bench/webauthn.md`](../../bench/webauthn.md) | `src/webauthn/*`, CoseKey |
| abi | [`bench/abi.md`](../../bench/abi.md) | Abi*, AbiParameters |
