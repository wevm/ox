import { describe, expect, test } from 'vitest'

import * as Evm from '../Evm.js'
import blake2F from './vectors/blake2F.json' with { type: 'json' }
import blsG1Add from './vectors/blsG1Add.json' with { type: 'json' }
import blsG1MultiExp from './vectors/blsG1MultiExp.json' with { type: 'json' }
import blsG2Add from './vectors/blsG2Add.json' with { type: 'json' }
import blsG2MultiExp from './vectors/blsG2MultiExp.json' with { type: 'json' }
import blsMapG1 from './vectors/blsMapG1.json' with { type: 'json' }
import blsMapG2 from './vectors/blsMapG2.json' with { type: 'json' }
import blsPairing from './vectors/blsPairing.json' with { type: 'json' }
import bn256Add from './vectors/bn256Add.json' with { type: 'json' }
import bn256Pairing from './vectors/bn256Pairing.json' with { type: 'json' }
import bn256ScalarMul from './vectors/bn256ScalarMul.json' with { type: 'json' }
import ecRecover from './vectors/ecRecover.json' with { type: 'json' }
import failBlake2f from './vectors/fail-blake2f.json' with { type: 'json' }
import failBlsG1Add from './vectors/fail-blsG1Add.json' with { type: 'json' }
import failBlsG1MultiExp from './vectors/fail-blsG1MultiExp.json' with { type: 'json' }
import failBlsG2Add from './vectors/fail-blsG2Add.json' with { type: 'json' }
import failBlsG2MultiExp from './vectors/fail-blsG2MultiExp.json' with { type: 'json' }
import failBlsMapG1 from './vectors/fail-blsMapG1.json' with { type: 'json' }
import failBlsMapG2 from './vectors/fail-blsMapG2.json' with { type: 'json' }
import failBlsPairing from './vectors/fail-blsPairing.json' with { type: 'json' }
import modexp from './vectors/modexp.json' with { type: 'json' }
import p256Verify from './vectors/p256Verify.json' with { type: 'json' }
import modexpEip2565 from './vectors/modexp_eip2565.json' with { type: 'json' }

/**
 * Known-answer vectors for the precompiles, taken from go-ethereum's
 * `core/vm/testdata/precompiles`.
 *
 * The differential harnesses in `scratchpad` compare each implementation
 * against the one before it, which catches regressions but is blind to an
 * error both share — a constant transcribed wrong once stays wrong. These
 * vectors come from outside this repository, so they close that gap. They
 * include the rejection cases, which is where the engine's own test corpus is
 * thinnest.
 *
 * The P256VERIFY set is the whole upstream file rather than a sample: 215 of
 * its 782 cases expect rejection, and they are Wycheproof-derived, which is
 * the closest thing to an adversarial corpus available for a curve.
 */

/**
 * Bytecode that STATICCALLs `address` with `gas` and the whole calldata, and
 * returns the call's success flag followed by its return data.
 *
 * There is no TS entry point for a precompile on its own — `Evm.run` takes
 * bytecode — so the call is made the way a contract would make it. The flag
 * matters because a rejected call and a call returning zeroes are different
 * answers and both come back as empty-looking output otherwise.
 */
function callPrecompile(address: string, gas: number) {
  // PUSH1 for the one-byte precompile addresses, PUSH2 for anything wider.
  const push = address.length === 2 ? '60' : '61'
  const g = gas.toString(16).padStart(8, '0')
  // `PUSH1 0` rather than PUSH0 throughout: the suites name forks as far back
  // as Byzantium to assert their own gas schedules, and PUSH0 is Shanghai.
  const z = '6000'
  return (
    `0x36${z}${z}37` + // CALLDATACOPY(0, 0, calldatasize)
    `610400611000${'36'}${z}${push}${address}63${g}fa` + // STATICCALL
    `${z}53` + // memory[0] = success
    `3d${z}6001${'3e'}` + // RETURNDATACOPY(1, 0, returndatasize)
    `3d600101${z}f3` // RETURN(0, returndatasize + 1)
  ) as const
}

/** Fork a suite's gas column belongs to, when it is not the default. */
type Suite = { address: string; cases: Case[]; fork?: Evm.Fork }

type Case = {
  name: string
  input: string
  expected?: string
  error?: string
  gas?: number
}

const suites: readonly (readonly [string, Suite])[] = [
  ['ecrecover (0x01)', ecRecover],
  // Each modexp file is a different schedule, and there have been three:
  // EIP-198's, EIP-2565's from Berlin, and EIP-7883's from Osaka. Naming the
  // fork lets all three assert their own prices instead of the newest one.
  ['modexp, EIP-198 pricing (0x05)', { ...modexp, fork: 'Byzantium' }],
  ['modexp, EIP-2565 pricing (0x05)', { ...modexpEip2565, fork: 'Berlin' }],
  ['blake2f (0x09)', blake2F],
  ['blake2f, rejections (0x09)', failBlake2f],
  ['P256VERIFY (0x0100)', p256Verify],
  ['bn254 G1 add (0x06)', bn256Add],
  ['bn254 G1 mul (0x07)', bn256ScalarMul],
  ['bn254 pairing (0x08)', bn256Pairing],
  ['BLS12-381 G1 add (0x0b)', blsG1Add],
  ['BLS12-381 G1 MSM (0x0c)', blsG1MultiExp],
  ['BLS12-381 G2 add (0x0d)', blsG2Add],
  ['BLS12-381 G2 MSM (0x0e)', blsG2MultiExp],
  ['BLS12-381 pairing (0x0f)', blsPairing],
  ['BLS12-381 map fp to G1 (0x10)', blsMapG1],
  ['BLS12-381 map fp2 to G2 (0x11)', blsMapG2],
  ['BLS12-381 G1 add, rejections (0x0b)', failBlsG1Add],
  ['BLS12-381 G1 MSM, rejections (0x0c)', failBlsG1MultiExp],
  ['BLS12-381 G2 add, rejections (0x0d)', failBlsG2Add],
  ['BLS12-381 G2 MSM, rejections (0x0e)', failBlsG2MultiExp],
  ['BLS12-381 pairing, rejections (0x0f)', failBlsPairing],
  ['BLS12-381 map fp to G1, rejections (0x10)', failBlsMapG1],
  ['BLS12-381 map fp2 to G2, rejections (0x11)', failBlsMapG2],
]

/** Enough for the widest MSM here, and far above any single precompile. */
const BUDGET = 200_000_000n
/** What a rejected input is given, since its own cost is not the point. */
const REJECT_GAS = 100_000_000

async function call(
  address: string,
  gas: number,
  input: string,
  fork: Evm.Fork,
) {
  const result = await Evm.run({
    bytecode: callPrecompile(address, gas),
    data: `0x${input}`,
    gas: BUDGET,
    fork,
  })
  expect(result.status).toBe('success')
  const out = result.data.slice(2)
  return { succeeded: out.slice(0, 2) === '01', returned: out.slice(2) }
}

describe.each(suites)('%s', (_name, suite) => {
  const fork = suite.fork ?? Evm.latestFork
  test.each(suite.cases.map((c) => [c.name, c] as const))('%s', async (_, c) => {
    if (c.error !== undefined) {
      // go-ethereum reports a reason string; the precompile ABI only carries
      // failure, so the assertion is that it did not succeed.
      const { succeeded } = await call(suite.address, REJECT_GAS, c.input, fork)
      expect(succeeded, `expected rejection: ${c.error}`).toBe(false)
      return
    }

    // A case without a gas figure is checked for its answer only.
    const gas = c.gas
    const { succeeded, returned } = await call(
      suite.address,
      gas ?? REJECT_GAS,
      c.input,
      fork,
    )
    expect(succeeded).toBe(true)
    expect(returned).toBe((c.expected as string).toLowerCase())

    // The vectors carry go-ethereum's price for each input, so the schedule is
    // checked as well as the answer: run it again a gas short and it must
    // fail. That is a tighter statement than "costs no more than", and it
    // catches a fee formula that is generous as well as one that overcharges —
    // EIP-2565's modexp pricing being the one most easily got wrong.
    if (gas !== undefined && gas > 0) {
      const short = await call(suite.address, gas - 1, c.input, fork)
      expect(short.succeeded, `should not fit in ${gas - 1} gas`).toBe(false)
    }
  })
})
