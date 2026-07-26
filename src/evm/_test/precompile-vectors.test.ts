import { describe, expect, test } from 'vitest'

import * as Evm from '../Evm.js'
import bn256Add from './vectors/bn256Add.json' with { type: 'json' }
import bn256Pairing from './vectors/bn256Pairing.json' with { type: 'json' }
import bn256ScalarMul from './vectors/bn256ScalarMul.json' with { type: 'json' }
import blsG1Add from './vectors/blsG1Add.json' with { type: 'json' }
import blsG1MultiExp from './vectors/blsG1MultiExp.json' with { type: 'json' }
import blsG2Add from './vectors/blsG2Add.json' with { type: 'json' }
import blsMapG1 from './vectors/blsMapG1.json' with { type: 'json' }
import blsPairing from './vectors/blsPairing.json' with { type: 'json' }
import failBlsG1Add from './vectors/fail-blsG1Add.json' with { type: 'json' }
import failBlsPairing from './vectors/fail-blsPairing.json' with { type: 'json' }

/**
 * Known-answer vectors for the curve precompiles, taken from go-ethereum's
 * `core/vm/testdata/precompiles`.
 *
 * The differential harnesses in `scratchpad` compare each implementation
 * against the one before it, which catches regressions but is blind to an
 * error both share — a constant transcribed wrong once stays wrong. These
 * vectors come from outside this repository, so they close that gap. They
 * include the rejection cases, which is where the engine's own test corpus is
 * thinnest.
 */

/**
 * Bytecode that STATICCALLs `address` with the whole calldata and returns the
 * call's success flag followed by its return data.
 *
 * There is no TS entry point for a precompile on its own — `Evm.run` takes
 * bytecode — so the call is made the way a contract would make it. The flag
 * matters because a rejected call and a call returning zeroes are different
 * answers and both come back as empty-looking output otherwise.
 */
function callPrecompile(address: string) {
  return `0x365f5f37${'610400'}${'611000'}365f60${address}5afa5f533d5f60013e3d600101${'5f'}f3` as const
}

const suites = [
  ['bn254 G1 add (0x06)', bn256Add],
  ['bn254 G1 mul (0x07)', bn256ScalarMul],
  ['bn254 pairing (0x08)', bn256Pairing],
  ['BLS12-381 G1 add (0x0b)', blsG1Add],
  ['BLS12-381 G1 MSM (0x0c)', blsG1MultiExp],
  ['BLS12-381 G2 add (0x0d)', blsG2Add],
  ['BLS12-381 pairing (0x0f)', blsPairing],
  ['BLS12-381 map fp to G1 (0x10)', blsMapG1],
  ['BLS12-381 G1 add, rejections (0x0b)', failBlsG1Add],
  ['BLS12-381 pairing, rejections (0x0f)', failBlsPairing],
] as const

describe.each(suites)('%s', (_name, suite) => {
  const bytecode = callPrecompile(suite.address)

  test.each(suite.cases.map((c) => [c.name, c] as const))('%s', async (_, c) => {
    const result = await Evm.run({
      bytecode,
      data: `0x${c.input}`,
      gas: 200_000_000n,
    })
    expect(result.status).toBe('success')

    const out = result.data.slice(2)
    const succeeded = out.slice(0, 2) === '01'
    const returned = out.slice(2)

    if ('error' in c) {
      // go-ethereum reports a reason string; the precompile ABI only carries
      // failure, so the assertion is that it did not succeed.
      expect(succeeded, `expected rejection: ${c.error}`).toBe(false)
      return
    }
    expect(succeeded).toBe(true)
    expect(returned).toBe(c.expected.toLowerCase())
  })
})
