import { Field } from '@noble/curves/abstract/modular.js'
import { grainGenConstants, poseidon } from '@noble/curves/abstract/poseidon.js'

/** BN254 scalar field modulus. */
export const fieldModulus =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

/** circomlib's partial round counts for widths 2 through 17. */
const roundsPartial = [
  56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68,
] as const

type Permutation = (state: bigint[]) => bigint[]

// Generating a width's constants takes tens of milliseconds, and they never change.
const permutations: (Permutation | undefined)[] = []

/**
 * Hashes 1 to 16 field elements with circomlib's Poseidon over the BN254 scalar field.
 *
 * The Grain LFSR reproduces circomlib's round constants and MDS matrices, so no
 * constant tables are bundled.
 */
export function hash(inputs: readonly bigint[]): bigint {
  const t = inputs.length + 1
  const rounds = roundsPartial[t - 2]
  if (rounds === undefined)
    throw new Error(`Poseidon takes 1 to 16 inputs, got ${inputs.length}.`)
  const permute = (permutations[t] ??= (() => {
    const options = {
      Fp: Field(fieldModulus),
      roundsFull: 8,
      roundsPartial: rounds,
      sboxPower: 5,
      t,
    }
    return poseidon({ ...options, ...grainGenConstants(options) })
  })())
  return permute([0n, ...inputs])[0]!
}
