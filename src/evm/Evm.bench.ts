import * as Evm from 'ox/evm/Evm'
import { bench, describe } from 'vp/test'

await Evm.ready()

const push = (value: bigint) => `7f${value.toString(16).padStart(64, '0')}`
const maxUint256 = 2n ** 256n - 1n

/** `body` repeated until it forms a tight loop, then returned. */
function program(body: string, repeats: number) {
  return `0x${body.repeat(repeats)}5f5260205ff3` as const
}

// A tight PUSH/PUSH/ADD/POP loop isolates dispatch overhead from any real work,
// which is the number to watch against revm at the Phase 2 go/no-go gate.
const dispatch = program('60016002015000', 2000)

// Multi-limb DIV and MULMOD exercise the Knuth path, the most expensive
// arithmetic in the interpreter.
const division = program(
  `${push(0x0123456789abcdefn)}${push(maxUint256)}0450`,
  500,
)
const mulmod = program(
  `${push(0xfffffffffffffffdn)}${push(maxUint256)}${push(maxUint256)}0950`,
  500,
)

// 10k keccak rounds over a 32-byte word — the `ten-thousand-hashes` shape.
const hashing = program('5f5f5f2050'.repeat(1), 10_000)

describe('Evm.run', () => {
  bench('dispatch (2k PUSH/PUSH/ADD/POP)', async () => {
    await Evm.run({ bytecode: dispatch })
  })

  bench('division (500 multi-limb DIV)', async () => {
    await Evm.run({ bytecode: division })
  })

  bench('mulmod (500 512-bit MULMOD)', async () => {
    await Evm.run({ bytecode: mulmod })
  })

  bench('keccak256 (10k empty hashes)', async () => {
    await Evm.run({ bytecode: hashing, gas: 100_000_000n })
  })
})
