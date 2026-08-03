import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vp/test'

import * as eest from '../../../test/evm/eest.js'

// Curated `ethereum/execution-spec-tests` state tests (release v5.4.0 — the
// corpus the WASM engine was validated against; see `test/evm/eest.ts` for
// the pin and download command). The subset under `fixtures/eest/` is the
// single-frame slice that is meaningful before the call family lands:
// storage (stSLoadTest, the pure stSStoreTest cases), memory (stMemoryTest,
// stMemoryStressTest), arithmetic (vmArithmeticTest, stShift), environment
// (stChainId, stCodeCopyTest, stSelfBalance, stArgsZeroOneBalance), the
// transaction validity ladder (stTransactionTest, eip7825), access lists
// (stEIP2930), transient storage (eip1153), blob context (eip4844), the
// EIP-7623 calldata floor, and CLZ (eip7939). Every checked-in case passes
// on the TS interpreter.
//
// Excluded until frames land (CALL family, CREATE/CREATE2, RETURNDATA*),
// re-enable per group as lane A lands: stCallCodes,
// stCallCreateCallCodeTest, stCallDelegateCodes*, stDelegatecallTestHomestead,
// stStaticCall, stReturnDataTest, stRevertTest, stCreate2, stCreateTest,
// stInitCodeTest, stEIP150*, stMemExpandingEIP150Calls, stRecursiveCreate,
// stPreCompiledContracts* (precompiles dispatch through CALL), stLogTests and
// vmLogTest (the logger is called through CALL), most of vmIOandFlowOperations
// and vmBitwiseLogicOperation (CALL-wrapped result recording), the reentrancy
// slices of eip1153_tstore and eip5656_mcopy, and
// prague/eip7702_set_code_tx (delegation reads land with PR 4).
//
// Runs offline: `SKIP_GLOBAL_SETUP=1 pnpm test src/evm --project core`.

const root = join(import.meta.dirname, 'fixtures', 'eest')

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (entry.endsWith('.json')) yield p
  }
}

const files = [...walk(root)].map((file) => ({
  cases: Object.entries(
    JSON.parse(readFileSync(file, 'utf8')) as Record<string, eest.FixtureCase>,
  ),
  name: relative(root, file),
}))

describe('runCase', () => {
  const adapter = eest.ts()
  for (const file of files)
    describe(file.name, () => {
      for (const [name, case_] of file.cases)
        for (const [fork, posts] of Object.entries(case_.post ?? {})) {
          // Defensive: every checked-in case is currently Cancun+, but a
          // future fixture carrying an older fork must be skipped rather
          // than fail — the TS core implements Cancun→Osaka only.
          if (!adapter.supports(fork)) continue
          posts.forEach((post, index) => {
            const label = `${name.split('::').at(-1) ?? name}${posts.length > 1 ? ` #${index}` : ''}`
            test(label, () => {
              const result = eest.runCase(adapter, case_, fork, post)
              expect(result.outcome).toEqual({ ok: true })
            })
          })
        }
    })
})
