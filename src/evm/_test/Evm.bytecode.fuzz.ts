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

/**
 * A short body repeated thousands of times.
 *
 * Short programs never reach the interesting states: a stack pointer drifting by
 * a fixed amount per iteration has to exceed the 1024-slot stack before it
 * corrupts anything, and block validation only runs on block entry.
 *
 * These cases assert determinism, not memory integrity — deterministic
 * corruption reproduces identically across runs, so re-running and comparing
 * cannot see it. `engine.test.ts` reads the code buffer back for that.
 */
const arbitraryLoop = () =>
  fc
    .tuple(
      fc.array(
        fc.oneof(
          fc.integer({ min: 0x01, max: 0x1d }),
          fc.integer({ min: 0x5f, max: 0x9f }),
          fc.constantFrom(0x20, 0x50, 0x51, 0x52, 0x53, 0x58, 0x59, 0x5a),
        ),
        { minLength: 1, maxLength: 8 },
      ),
      fc.integer({ min: 1200, max: 3000 }),
    )
    .map(([body, repeats]) =>
      Hex.fromBytes(new Uint8Array(Array(repeats).fill(body).flat())),
    )

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

  test.prop({ bytecode: arbitraryLoop() }, { numRuns })(
    'thousands of iterations stay contained and deterministic',
    async ({ bytecode }) => {
      // A run must not leave state behind that changes the next one.
      const first = await Evm.run({ bytecode, gas: 100_000_000n })
      const second = await Evm.run({ bytecode, gas: 100_000_000n })
      expect(statuses.has(first.status)).toBe(true)
      expect(second).toEqual(first)
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

describe('copy opcodes pad rather than wrap', () => {
  // CALLDATACOPY, CODECOPY and EXTCODECOPY zero-pad a read that runs past the
  // end of their source. The source offset is a 256-bit operand saturated into
  // 64 bits, so an offset that looks negative arrives as a value near 2^64;
  // adding the loop index to it used to wrap back to zero part way through the
  // copy and start returning real bytes. The result was still a valid status, so
  // the containment properties above could not see it.
  //
  // RETURNDATACOPY is deliberately absent: it is the one that does not pad, and
  // an out-of-range read is an exceptional halt.
  const opcodes = [
    { name: 'CALLDATACOPY', op: '37' },
    { name: 'CODECOPY', op: '39' },
  ] as const

  test.prop(
    {
      // Offsets in the top few bytes of the 256-bit range, which is where a
      // small negative number lands.
      back: fc.bigInt({ min: 1n, max: 64n }),
      length: fc.integer({ min: 1, max: 32 }),
      which: fc.integer({ min: 0, max: opcodes.length - 1 }),
    },
    { numRuns },
  )(
    'a source offset near 2^256 reads only zeroes',
    async ({ back, length, which }) => {
      const { op } = opcodes[which]!
      const offset = ((1n << 256n) - back).toString(16).padStart(64, '0')
      // PUSH1 length, PUSH32 offset, PUSH1 0, <copy>, PUSH1 0, MLOAD, PUSH1 0,
      // MSTORE, PUSH1 32, PUSH1 0, RETURN
      const bytecode: Hex.Hex = `0x60${length
        .toString(16)
        .padStart(2, '0')}7f${offset}5f${op}5f515f5260205ff3`
      const result = await Evm.run({
        bytecode,
        // Calldata that is entirely non-zero, so any wraparound shows up.
        data: `0x${'ab'.repeat(64)}`,
        gas: 1_000_000n,
      })
      expect(result.status).toBe('success')
      expect(result.data).toBe(`0x${'00'.repeat(32)}`)
    },
  )
})
