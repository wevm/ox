import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { Evm } from 'ox/evm'
import { describe, expect } from 'vp/test'

import * as oracle from '../../../test/evm/oracle.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// Differential fuzz: the TypeScript interpreter against the WASM engine that
// passed 40551/40553 execution-spec state tests. Status class, gas, and
// output must agree — halt *reasons* are excluded, since the engines detect
// exceptional conditions in different orders (per-opcode here, per-basic-block
// there) and consensus does not distinguish them.

function statusClass(result: Evm.Result) {
  return result.status === 'halted' ? 'exceptional' : result.status
}

/**
 * Random opcode sequences over the M1 instruction set — arithmetic through
 * control flow, plus MCOPY and CLZ. Any opcode outside this set is undefined
 * on both engines at this milestone and would only test invalid-opcode parity.
 */
const arbitraryProgram = () =>
  fc
    .array(
      fc.oneof(
        // Arithmetic, comparison, bitwise, CLZ: pop-heavy.
        fc.integer({ min: 0x01, max: 0x1e }),
        // PUSH0..PUSH32, DUP, SWAP: push-heavy.
        fc.integer({ min: 0x5f, max: 0x9f }),
        // Keccak, calldata/code, memory, flow, terminators.
        fc.constantFrom(
          0x00,
          0x20,
          0x35,
          0x36,
          0x37,
          0x38,
          0x39,
          0x50,
          0x51,
          0x52,
          0x53,
          0x56,
          0x57,
          0x58,
          0x59,
          0x5a,
          0x5b,
          0x5e,
          0xf3,
          0xfd,
          0xfe,
        ),
      ),
      { minLength: 0, maxLength: 256 },
    )
    .map((ops) => new Uint8Array(ops))

/** A short body repeated thousands of times — deep stacks, real loops. */
const arbitraryLoop = () =>
  fc
    .tuple(
      fc.array(
        fc.oneof(
          fc.integer({ min: 0x01, max: 0x1e }),
          fc.integer({ min: 0x5f, max: 0x9f }),
          fc.constantFrom(0x20, 0x50, 0x51, 0x52, 0x53, 0x58, 0x59, 0x5a, 0x5e),
        ),
        { minLength: 1, maxLength: 8 },
      ),
      fc.integer({ min: 1200, max: 3000 }),
    )
    .map(([body, repeats]) => new Uint8Array(Array(repeats).fill(body).flat()))

const arbitraryCalldata = () => fc.uint8Array({ minLength: 0, maxLength: 128 })

function compare(
  bytecode: Uint8Array,
  options: { data?: Uint8Array; gas: bigint; hardfork?: 'prague' | 'osaka' },
) {
  const expected = oracle.run({ bytecode, ...options })
  const actual = Evm.run({
    bytecode,
    data: options.data,
    gas: options.gas,
    hardfork: options.hardfork,
  })

  expect(statusClass(actual), `status (oracle: ${expected.status})`).toBe(
    expected.statusClass,
  )
  expect(actual.gasUsed, `gasUsed (oracle: ${expected.status})`).toBe(
    expected.gasUsed,
  )
  if (actual.status !== 'halted')
    expect(actual.output).toBe(Hex.fromBytes(expected.output))
}

describe('TS interpreter matches the WASM engine', () => {
  test.prop(
    {
      bytecode: arbitraryProgram(),
      data: arbitraryCalldata(),
      gas: fc.constantFrom(200n, 20_000n, 1_000_000n),
    },
    { numRuns },
  )(
    'programs: status class, gas, and output agree',
    ({ bytecode, data, gas }) => {
      compare(bytecode, { data, gas })
    },
  )

  test.prop({ bytecode: arbitraryLoop() }, { numRuns })(
    'loops: thousands of iterations agree',
    ({ bytecode }) => {
      compare(bytecode, { gas: 100_000_000n })
    },
  )

  test.prop(
    { bytecode: arbitraryProgram(), data: arbitraryCalldata() },
    { numRuns },
  )(
    'prague: fork gating agrees (CLZ undefined on both)',
    ({ bytecode, data }) => {
      compare(bytecode, { data, gas: 1_000_000n, hardfork: 'prague' })
    },
  )
})
