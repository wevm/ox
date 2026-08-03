import { bench, describe, expect } from 'vp/test'

import * as Evm from './Evm.js'

const push = (value: bigint) => `7f${value.toString(16).padStart(64, '0')}`
const maxUint256 = 2n ** 256n - 1n
const gas = 10_000_000_000n

// Loop bodies must not contain a stray `00` — that is STOP, and the program
// halts on the first iteration while still costing full jumpdest analysis, so
// the bench silently measures analysis throughput instead of execution. The
// `expectedGas` assertion below is what catches that.
function program(body: string, repeats: number, expectedGas: bigint) {
  const bytecode = `0x${body.repeat(repeats)}00` as const
  return { bytecode, expectedGas }
}

// A tight PUSH/PUSH/ADD/POP loop isolates dispatch overhead from real work.
// 3 + 3 + 3 + 2 = 11 gas per iteration.
const dispatch = program('600160020150', 7000, 7000n * 11n)

// Wide DIV and 512-bit MULMOD are the most expensive arithmetic paths.
// 3 + 3 + 5 + 2 and 3 + 3 + 3 + 8 + 2.
const division = program(
  `${push(0x0123456789abcdefn)}${push(maxUint256)}0450`,
  300,
  300n * 13n,
)
const mulmod = program(
  `${push(0xfffffffffffffffdn)}${push(maxUint256)}${push(maxUint256)}0950`,
  300,
  300n * 19n,
)

// PUSH1 32 (length), PUSH0 (offset), KECCAK256, POP.
// 3 + 2 + (30 + 6) + 2 = 43 per iteration, plus 3 once for memory expansion.
const hashing = program('60205f2050', 9000, 9000n * 43n + 3n)

describe('Evm.run', () => {
  for (const [name, { bytecode, expectedGas }] of Object.entries({
    'dispatch (7k PUSH/PUSH/ADD/POP)': dispatch,
    'division (300 wide DIV)': division,
    'mulmod (300 512-bit MULMOD)': mulmod,
    'keccak256 (9k x 32 bytes)': hashing,
  })) {
    bench(name, () => {
      const result = Evm.run({ bytecode, gas })
      // Guards against a program that halts early and makes the bench look fast.
      expect(result.status).toBe('success')
      expect(result.gasUsed).toBe(expectedGas)
    })
  }
})
