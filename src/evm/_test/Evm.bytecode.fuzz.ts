import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import * as Evm from 'ox/evm/Evm'
import { beforeAll, describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// The interpreter validates gas and stack bounds once per basic block and the
// opcode handlers carry no checks of their own. If `analyze` miscomputes a
// block's `stack_req` or `stack_max_growth`, the result is an out-of-bounds
// read or write inside linear memory rather than a clean error — so arbitrary
// bytecode must never trap the module or produce an unknown status.

const statuses = new Set([
  'success',
  'reverted',
  'out-of-gas',
  'stack-underflow',
  'stack-overflow',
  'invalid-opcode',
  'invalid-jump',
  'out-of-memory',
  'code-too-large',
  'input-too-large',
])

/** Uniformly random bytes — mostly undefined opcodes and malformed jumps. */
const arbitraryBytecode = () =>
  fc.uint8Array({ minLength: 0, maxLength: 512 }).map(Hex.fromBytes)

/**
 * Random bytes drawn from the implemented opcodes, which reaches deep stacks
 * and real block structure far more often than uniform bytes do.
 */
const arbitraryProgram = () =>
  fc
    .array(
      fc.oneof(
        // Arithmetic, comparison, bitwise: pop-heavy, so they drive underflow.
        fc.integer({ min: 0x01, max: 0x1d }),
        // PUSH0..PUSH32, DUP, SWAP: push-heavy, so they drive overflow.
        fc.integer({ min: 0x5f, max: 0x9f }),
        // Memory, jumps, JUMPDEST, POP, and the terminators.
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
          0xf3,
          0xfd,
        ),
      ),
      { minLength: 0, maxLength: 256 },
    )
    .map((ops) => Hex.fromBytes(new Uint8Array(ops)))

beforeAll(async () => {
  await Evm.ready()
})

describe('arbitrary bytecode is contained', () => {
  test.prop({ bytecode: arbitraryBytecode() }, { numRuns })(
    'random bytes never trap and always yield a known status',
    async ({ bytecode }) => {
      const result = await Evm.run({ bytecode, gas: 1_000_000n })
      expect(statuses.has(result.status)).toBe(true)
      expect(result.gasUsed).toBeGreaterThanOrEqual(0n)
      expect(result.gasLeft).toBeGreaterThanOrEqual(0n)
      expect(result.gasUsed + result.gasLeft).toBe(1_000_000n)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'random opcode sequences never trap and always yield a known status',
    async ({ bytecode }) => {
      const result = await Evm.run({ bytecode, gas: 1_000_000n })
      expect(statuses.has(result.status)).toBe(true)
      expect(result.gasUsed + result.gasLeft).toBe(1_000_000n)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'an exceptional halt consumes all gas',
    async ({ bytecode }) => {
      const result = await Evm.run({ bytecode, gas: 1_000_000n })
      // `success` and `reverted` return unspent gas; every other halt is
      // exceptional and burns the lot.
      if (result.status !== 'success' && result.status !== 'reverted')
        expect(result.gasLeft).toBe(0n)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'running under a tight gas limit is still contained',
    async ({ bytecode }) => {
      // Low limits make blocks fail their entry gas check partway through a
      // program, exercising a different path than the generous-gas runs.
      const result = await Evm.run({ bytecode, gas: 200n })
      expect(statuses.has(result.status)).toBe(true)
    },
  )
})
