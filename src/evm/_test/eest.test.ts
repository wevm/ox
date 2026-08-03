import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vp/test'

import * as eest from '../../../test/evm/eest.js'

// Curated `ethereum/execution-spec-tests` state tests (release v5.4.0 — the
// corpus the WASM engine was validated against; see `test/evm/eest.ts` for
// the pin and download command). The subset under `fixtures/eest/` is the
// curated Cancun-to-Osaka slice: storage (stSLoadTest and pure stSStoreTest),
// memory (stMemoryTest,
// stMemoryStressTest), arithmetic (vmArithmeticTest, stShift), environment
// (stChainId, stCodeCopyTest, stSelfBalance, stArgsZeroOneBalance), the
// transaction validity ladder (stTransactionTest, eip7825), access lists
// (stEIP2930), transient storage (eip1153), blob context (eip4844), the
// EIP-7623 calldata floor, and CLZ (eip7939). Every checked-in case passes
// on the TS interpreter.
//
// Calls, returndata, and creation are enabled. Remaining exclusions include
// precompile-dependent cases, stEIP150*, stMemExpandingEIP150Calls,
// stLogTests, vmLogTest, most vmIOandFlowOperations and
// vmBitwiseLogicOperation, the reentrant transient-storage and MCOPY slices,
// and prague/eip7702_set_code_tx (delegation reads land with PR 4).
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

describe('transaction validity', () => {
  const sender = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
  const recipient = '0x00000000000000000000000000000000000000c0'
  const post = { indexes: { data: 0, gas: 0, value: 0 } }

  function fixture(code: string): eest.FixtureCase {
    return {
      env: {
        currentBaseFee: '0x0',
        currentCoinbase: '0x0000000000000000000000000000000000000000',
        currentExcessBlobGas: '0x0',
        currentGasLimit: '0x1c9c380',
        currentNumber: '0x1',
        currentTimestamp: '0x1',
      },
      pre: {
        [sender]: {
          balance: '0xde0b6b3a7640000',
          code,
          nonce: '0x0',
          storage: {},
        },
      },
      transaction: {
        data: ['0x'],
        gasLimit: ['0x5208'],
        gasPrice: '0x0',
        nonce: '0x0',
        sender,
        to: recipient,
        value: ['0x0'],
      },
    }
  }

  test('requires a complete delegation designation', () => {
    const malformed = eest.runCase(
      eest.ts(),
      fixture('0xef0100'),
      'Prague',
      post,
    )
    expect(malformed.rejected).toBe(true)

    const complete = eest.runCase(
      eest.ts(),
      fixture(`0xef0100${recipient.slice(2)}`),
      'Prague',
      post,
    )
    expect(complete.rejected).toBe(false)
  })

  test('rejects malformed-width blob hashes', () => {
    const case_ = fixture('0x')
    case_.transaction = {
      ...case_.transaction,
      blobVersionedHashes: ['0x01'],
      maxFeePerBlobGas: '0x1',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
    }
    const result = eest.runCase(eest.ts(), case_, 'Prague', post)
    expect(result.rejected).toBe(true)
  })
})
