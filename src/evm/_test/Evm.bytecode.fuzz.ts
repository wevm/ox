import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { Evm } from 'ox/evm'
import { describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// Opcode handlers rely on the dispatch loop for gas and stack validation and
// carry no bounds checks of their own — so arbitrary bytecode must never
// throw and must always yield a known status with coherent gas accounting.

const haltReasons = new Set([
  'invalid-jump',
  'invalid-opcode',
  'memory-limit',
  'out-of-gas',
  'stack-overflow',
  'stack-underflow',
])

function check(result: Evm.Result): void {
  if (result.status === 'halted')
    expect(haltReasons.has(result.reason)).toBe(true)
  else expect(['success', 'reverted']).toContain(result.status)
}

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
 * A short body repeated thousands of times, asserting determinism: a run must
 * not leave state behind that changes the next one.
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

describe('arbitrary bytecode is contained', () => {
  test.prop({ bytecode: arbitraryBytecode() }, { numRuns })(
    'random bytes never throw and always yield a known status',
    ({ bytecode }) => {
      const result = Evm.run({ bytecode, gas: 1_000_000n })
      check(result)
      expect(result.gasUsed).toBeGreaterThanOrEqual(0n)
      expect(result.gasUsed).toBeLessThanOrEqual(1_000_000n)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'random opcode sequences never throw and always yield a known status',
    ({ bytecode }) => {
      const result = Evm.run({ bytecode, gas: 1_000_000n })
      check(result)
      expect(result.gasUsed).toBeLessThanOrEqual(1_000_000n)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'an exceptional halt consumes all gas',
    ({ bytecode }) => {
      const result = Evm.run({ bytecode, gas: 1_000_000n })
      // `success` and `reverted` return unspent gas; every other halt is
      // exceptional and burns the lot.
      if (result.status === 'halted') expect(result.gasUsed).toBe(1_000_000n)
    },
  )

  test.prop({ bytecode: arbitraryLoop() }, { numRuns })(
    'thousands of iterations stay contained and deterministic',
    ({ bytecode }) => {
      const first = Evm.run({ bytecode, gas: 100_000_000n })
      const second = Evm.run({ bytecode, gas: 100_000_000n })
      check(first)
      expect(second).toEqual(first)
    },
  )

  test.prop({ bytecode: arbitraryProgram() }, { numRuns })(
    'running under a tight gas limit is still contained',
    ({ bytecode }) => {
      const result = Evm.run({ bytecode, gas: 200n })
      check(result)
    },
  )
})

describe('copy opcodes pad rather than wrap', () => {
  // CALLDATACOPY and CODECOPY zero-pad a read that runs past the end of their
  // source. The source offset is an unclamped 256-bit operand: a value that
  // looks like a small negative number arrives near 2^256, and adding the
  // copy cursor to it must not wrap back into real bytes.
  //
  // RETURNDATACOPY is deliberately absent: it is the one that does not pad,
  // and an out-of-range read is an exceptional halt (lands with M3).
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
    ({ back, length, which }) => {
      const { op } = opcodes[which]!
      const offset = ((1n << 256n) - back).toString(16).padStart(64, '0')
      // PUSH1 length, PUSH32 offset, PUSH1 0, <copy>, PUSH1 0, MLOAD, PUSH1 0,
      // MSTORE, PUSH1 32, PUSH1 0, RETURN
      const bytecode: Hex.Hex = `0x60${length
        .toString(16)
        .padStart(2, '0')}7f${offset}5f${op}5f515f5260205ff3`
      const result = Evm.run({
        bytecode,
        // Calldata that is entirely non-zero, so any wraparound shows up.
        data: `0x${'ab'.repeat(64)}`,
        gas: 1_000_000n,
      })
      Evm.assertSuccess(result)
      expect(result.output).toBe(`0x${'00'.repeat(32)}`)
    },
  )
})
