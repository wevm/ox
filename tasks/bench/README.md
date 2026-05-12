# Track B Bench Harness

Performance benchmarking infrastructure for the Track B perf-foundations work in [tasks/master-plan.md](../master-plan.md).

## Convention

- Benches live next to source as `src/**/*.bench.ts`. They are picked up automatically by the project Vitest config (`benchmark.include` in [`test/vitest.config.ts`](../../test/vitest.config.ts)).
- Run the suite with `pnpm bench`. Append `--run` for a one-shot non-watch invocation.
- Vitest writes the machine readable report to `./.bench/report.json` (gitignored).
- Every Phase 1 PR that claims a perf win MUST append measured numbers to [`RESULTS.md`](./RESULTS.md) under the section for its area. No numbers, no merge.

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
2. Add or update a row in the relevant area section of [`RESULTS.md`](./RESULTS.md) with: bench name, baseline ops/s, PR ops/s, delta (`%` faster), commit SHA.
3. Keep entries terse (one line per bench). Group by file under the area heading.

## Areas

Each Phase 1 workstream owns a section in `RESULTS.md`:

- foundations (Bytes, Hex, Hash, Rlp leaf primitives)
- encoding (Cbor, Json, CompactSize, Base*, Bech32m)
- transactions (TxEnvelope*, AccessList, Authorization, Withdrawal, Blobs)
- address-keys (Address, HdKey, Mnemonic, Keystore, Ens, ContractAddress)
- block-state (Block, Log, Filter, Bloom, Fee, BinaryStateTree, AccountProof, *Overrides)
- crypto (Secp256k1, P256, Ed25519, X25519, Bls, Hash, AesGcm)
- erc (erc4337, erc6492, erc7821, erc8010, erc8021)
- rpc (Provider, Rpc*, Caches, Errors)
- tempo (`src/tempo/*`)
- webauthn (`src/webauthn/*`, CoseKey)
- abi (Abi*, AbiParameters)
