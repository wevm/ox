import { Evm } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

// Exact-gas matrix: every M1 opcode's cost pinned as a literal, computed by
// hand from the fee schedule — not derived from the implementation. A wrong
// constant fails here even when the value semantics are right.

function used(
  bytecode: `0x${string}`,
  options: {
    data?: `0x${string}`
    hardfork?: 'cancun' | 'prague' | 'osaka'
    status?: 'success' | 'reverted'
  } = {},
): bigint {
  const { status = 'success' } = options
  const result = Evm.run({
    bytecode,
    data: options.data,
    hardfork: options.hardfork,
  })
  expect(result.status).toBe(status)
  return result.gasUsed
}

describe('static costs', () => {
  // Each row: [name, bytecode, expected]. Operands come from PUSH0 (2 gas)
  // and PUSH1 (3 gas); the remainder is the opcode under test.
  const cases: [string, `0x${string}`, bigint][] = [
    ['STOP', '0x00', 0n],
    ['ADD = 3', '0x6001600101', 9n],
    ['MUL = 5', '0x6002600302', 11n],
    ['SUB = 3', '0x6001600103', 9n],
    ['DIV = 5', '0x6001600204', 11n],
    ['SDIV = 5', '0x6001600205', 11n],
    ['MOD = 5', '0x6001600206', 11n],
    ['SMOD = 5', '0x6001600207', 11n],
    ['ADDMOD = 8', '0x60016001600108', 17n],
    ['MULMOD = 8', '0x60016001600109', 17n],
    ['SIGNEXTEND = 5', '0x5f60010b', 10n],
    ['LT = 3', '0x5f5f10', 7n],
    ['GT = 3', '0x5f5f11', 7n],
    ['SLT = 3', '0x5f5f12', 7n],
    ['SGT = 3', '0x5f5f13', 7n],
    ['EQ = 3', '0x5f5f14', 7n],
    ['ISZERO = 3', '0x5f15', 5n],
    ['AND = 3', '0x5f5f16', 7n],
    ['OR = 3', '0x5f5f17', 7n],
    ['XOR = 3', '0x5f5f18', 7n],
    ['NOT = 3', '0x5f19', 5n],
    ['BYTE = 3', '0x5f5f1a', 7n],
    ['SHL = 3', '0x5f5f1b', 7n],
    ['SHR = 3', '0x5f5f1c', 7n],
    ['SAR = 3', '0x5f5f1d', 7n],
    ['CLZ = 5', '0x5f1e', 7n],
    ['CALLDATALOAD = 3', '0x5f35', 5n],
    ['CALLDATASIZE = 2', '0x36', 2n],
    ['CODESIZE = 2', '0x38', 2n],
    ['POP = 2', '0x5f50', 4n],
    ['JUMP = 8, JUMPDEST = 1', '0x6003565b', 12n],
    ['JUMPI taken = 10', '0x6001600657fe5b', 17n],
    ['JUMPI not taken = 10', '0x5f600457', 15n],
    ['PC = 2', '0x58', 2n],
    ['MSIZE = 2', '0x59', 2n],
    ['GAS = 2', '0x5a', 2n],
    ['JUMPDEST = 1', '0x5b', 1n],
    ['PUSH0 = 2', '0x5f', 2n],
    ['PUSH1 = 3', '0x6001', 3n],
    [`PUSH32 = 3`, `0x7f${'ff'.repeat(32)}`, 3n],
    ['DUP1 = 3', '0x5f80', 5n],
    [`DUP16 = 3`, `0x${'5f'.repeat(16)}8f`, 35n],
    ['SWAP1 = 3', '0x5f5f90', 7n],
    [`SWAP16 = 3`, `0x${'5f'.repeat(17)}9f`, 37n],
    ['RETURN (empty) = 0', '0x5f5ff3', 4n],
  ]

  for (const [name, bytecode, expected] of cases)
    test(name, () => {
      expect(used(bytecode)).toBe(expected)
    })

  test('REVERT (empty) = 0', () => {
    expect(used('0x5f5ffd', { status: 'reverted' })).toBe(4n)
  })
})

describe('EXP: 10 + 50 per exponent byte', () => {
  const cases: [string, `0x${string}`, bigint][] = [
    // EXP pops base from the top, so the exponent is pushed first.
    ['exponent 0 (0 bytes)', '0x5f600a0a', 15n],
    ['exponent 5 (1 byte)', '0x6005600a0a', 66n],
    ['exponent 256 (2 bytes)', '0x61010060020a', 116n],
    ['exponent 2^256-1 (32 bytes)', `0x7f${'ff'.repeat(32)}60020a`, 1616n],
  ]
  for (const [name, bytecode, expected] of cases)
    test(name, () => {
      expect(used(bytecode)).toBe(expected)
    })
})

describe('KECCAK256: 30 + 6 per word + expansion', () => {
  const cases: [string, `0x${string}`, bigint][] = [
    ['length 0: no words, no expansion', '0x5f5f20', 34n],
    ['length 1: one word, one-word expansion', '0x60015f20', 44n],
    ['length 32: one word', '0x60205f20', 44n],
    ['length 33: two words', '0x60215f20', 53n],
    ['length 64: two words', '0x60405f20', 53n],
  ]
  for (const [name, bytecode, expected] of cases)
    test(name, () => {
      expect(used(bytecode)).toBe(expected)
    })
})

describe('copies: 3 + 3 per word + expansion', () => {
  const cases: [string, `0x${string}`, bigint][] = [
    ['CALLDATACOPY length 0', '0x5f5f5f37', 9n],
    ['CALLDATACOPY length 1', '0x60015f5f37', 16n],
    ['CALLDATACOPY length 33', '0x60215f5f37', 22n],
    ['CODECOPY length 1', '0x60015f5f39', 16n],
    ['MCOPY length 0', '0x5f5f5f5e', 9n],
    ['MCOPY length 32', '0x60205f5f5e', 16n],
  ]
  for (const [name, bytecode, expected] of cases)
    test(name, () => {
      expect(used(bytecode, { data: `0x${'ab'.repeat(64)}` })).toBe(expected)
    })
})

describe('memory expansion: 3 per word + words²/512', () => {
  // MSTORE8 at offset X expands to X+1 bytes: PUSH0 (value), PUSH offset,
  // MSTORE8. Base cost 2 + 3 + 3 = 8 plus the expansion literal.
  const cases: [string, `0x${string}`, bigint][] = [
    ['offset 0 → 1 word: 3', '0x5f5f53', 10n],
    ['offset 31 → 1 word: 3', '0x5f601f53', 11n],
    ['offset 32 → 2 words: 6', '0x5f602053', 14n],
    ['offset 1023 → 32 words: 96 + 2', '0x5f6103ff53', 106n],
    ['offset 1024 → 33 words: 99 + 2', '0x5f61040053', 109n],
    ['offset 32767 → 1024 words: 3072 + 2048', '0x5f617fff53', 5128n],
    ['offset 65535 → 2048 words: 6144 + 8192', '0x5f61ffff53', 14344n],
  ]
  for (const [name, bytecode, expected] of cases)
    test(name, () => {
      expect(used(bytecode)).toBe(expected)
    })

  test('expansion is charged on the delta only', () => {
    // MSTORE8 at 0 (expands 1 word), then at 32 (delta: one more word).
    // 2+2+3+3, then 2+3+3+3.
    expect(used('0x5f5f535f602053')).toBe(21n)
  })

  test('word-at-a-time growth telescopes to the closed form', () => {
    // (PUSH0, MSIZE, MSTORE8) × 600 grows memory one word per iteration.
    // The quadratic charge must floor per size, so the total telescopes to
    // exactly ⌊600²/512⌋: 600×(2+2+3) + 3×600 + 703. Found by the WASM
    // differential oracle — flooring the per-step delta under-charges.
    expect(used(`0x${'5f5953'.repeat(600)}`)).toBe(6703n)
  })

  test('MLOAD expands like a 32-byte write', () => {
    // PUSH0 MLOAD: 2 + 3 + 3. PUSH1 32, MLOAD: 3 + 3 + 6.
    expect(used('0x5f51')).toBe(8n)
    expect(used('0x602051')).toBe(12n)
  })

  test('zero-length touches never expand', () => {
    // RETURN, KECCAK256, CALLDATACOPY, MCOPY with length 0 at offset 2^255.
    const offset = `7f80${'00'.repeat(31)}` as const
    expect(used(`0x5f${offset}f3`)).toBe(5n)
    expect(used(`0x5f${offset}20`, {})).toBe(35n)
  })
})

describe('fork gating', () => {
  test('CLZ costs 5 on osaka, is undefined before', () => {
    expect(used('0x5f1e', { hardfork: 'osaka' })).toBe(7n)
    const result = Evm.run({ bytecode: '0x5f1e', hardfork: 'prague' })
    expect(result.status).toBe('halted')
  })
})
