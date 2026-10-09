import { bn254 } from '@noble/curves/bn254'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import type * as Hex from '../core/Hex.js'
import { LruMap } from '../core/internal/lru.js'
import * as Poseidon from './internal/poseidon.js'

/** Size of an encoded proof, `A || B || C`, in bytes. */
export const proofSize = 256

/** Size of an encoded verifying key with one public input, in bytes. */
export const verifyingKeySize = 576

type G1 = ReturnType<typeof bn254.G1.ProjectivePoint.fromAffine>
type G2 = ReturnType<typeof bn254.G2.ProjectivePoint.fromAffine>

type VerifyingKey = {
  alpha: G1
  beta: G2
  delta: G2
  gamma: G2
  ic: readonly [G1, G1]
}

// Decoding a verifying key checks three G2 subgroup memberships, so decoded keys are kept.
const verifyingKeys = new LruMap<VerifyingKey>(16)

/**
 * Verifies a Groth16 proof over BN254 with one public input, as Tempo nodes verify
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131#verification) ZK signatures:
 * `e(A, B) = e(alpha, beta) · e(IC[0] + input · IC[1], gamma) · e(C, delta)`.
 *
 * Points use TIP-1131's encoding: uncompressed [EIP-197](https://eips.ethereum.org/EIPS/eip-197)
 * points with 32-byte big-endian coordinates, and `F_p^2` elements written `(c1, c0)`. The proof
 * is `A || B || C`, 256 bytes, and the verifying key `alpha || beta || gamma || delta || IC[0] || IC[1]`,
 * 576 bytes. A proof whose points are malformed, off their curve, outside their subgroup, or at
 * infinity does not verify.
 *
 * @example
 * ```ts twoslash
 * import { Groth16 } from 'ox/tempo'
 *
 * const valid = Groth16.verify({
 *   proof: '0x...',
 *   publicInput: '0x...',
 *   verifyingKey: '0x...'
 * })
 * ```
 *
 * @param options - The proof, its public input, and the verifying key.
 * @returns Whether the proof is valid.
 */
export function verify(options: verify.Options): boolean {
  const { proof, publicInput } = options
  const vk = decodeVerifyingKey(options.verifyingKey)
  const input =
    typeof publicInput === 'bigint'
      ? publicInput
      : Bytes.toBigInt(Bytes.from(publicInput))
  if (input < 0n || input >= Poseidon.fieldModulus) return false
  const bytes = Bytes.from(proof)
  if (bytes.length !== proofSize) return false
  let a: G1
  let b: G2
  let c: G1
  try {
    a = decodeG1(bytes.subarray(0, 64))
    b = decodeG2(bytes.subarray(64, 192))
    c = decodeG1(bytes.subarray(192, 256))
  } catch (error) {
    if (error instanceof InvalidPointError) return false
    throw error
  }
  const [ic0, ic1] = vk.ic
  const l = input === 0n ? ic0 : ic0.add(ic1.multiply(input))
  if (l.equals(bn254.G1.ProjectivePoint.ZERO)) return false
  const result = bn254.pairingBatch([
    { g1: a, g2: b },
    { g1: vk.alpha.negate(), g2: vk.beta },
    { g1: l.negate(), g2: vk.gamma },
    { g1: c.negate(), g2: vk.delta },
  ])
  return bn254.fields.Fp12.eql(result, bn254.fields.Fp12.ONE)
}

export declare namespace verify {
  type Options = {
    /** The 256-byte proof, `A || B || C`. */
    proof: Hex.Hex | Bytes.Bytes
    /** The public input, a BN254 scalar field element. */
    publicInput: Hex.Hex | Bytes.Bytes | bigint
    /** The 576-byte verifying key, `alpha || beta || gamma || delta || IC[0] || IC[1]`. */
    verifyingKey: Hex.Hex | Bytes.Bytes
  }

  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidVerifyingKeyError
    | Errors.GlobalErrorType
}

function decodeVerifyingKey(value: Hex.Hex | Bytes.Bytes): VerifyingKey {
  const bytes = Bytes.from(value)
  if (bytes.length !== verifyingKeySize)
    throw new InvalidVerifyingKeyError({
      reason: `expected ${verifyingKeySize} bytes, got ${bytes.length}`,
    })
  const key = Bytes.toHex(bytes)
  const cached = verifyingKeys.get(key)
  if (cached) return cached
  try {
    const decoded = {
      alpha: decodeG1(bytes.subarray(0, 64)),
      beta: decodeG2(bytes.subarray(64, 192)),
      gamma: decodeG2(bytes.subarray(192, 320)),
      delta: decodeG2(bytes.subarray(320, 448)),
      ic: [
        decodeG1(bytes.subarray(448, 512)),
        decodeG1(bytes.subarray(512, 576)),
      ],
    } as const
    verifyingKeys.set(key, decoded)
    return decoded
  } catch (error) {
    if (error instanceof InvalidPointError)
      throw new InvalidVerifyingKeyError({ reason: error.reason })
    throw error
  }
}

function decodeFp(bytes: Uint8Array): bigint {
  const value = Bytes.toBigInt(bytes)
  if (value >= bn254.fields.Fp.ORDER)
    throw new InvalidPointError({
      reason: 'a coordinate is not less than the base field modulus',
    })
  return value
}

function decodeG1(bytes: Uint8Array): G1 {
  const x = decodeFp(bytes.subarray(0, 32))
  const y = decodeFp(bytes.subarray(32, 64))
  return checked(bn254.G1.ProjectivePoint, { x, y }, x === 0n && y === 0n)
}

function decodeG2(bytes: Uint8Array): G2 {
  const { Fp2 } = bn254.fields
  const [x1, x0, y1, y0] = [0, 32, 64, 96].map((offset) =>
    decodeFp(bytes.subarray(offset, offset + 32)),
  ) as [bigint, bigint, bigint, bigint]
  return checked(
    bn254.G2.ProjectivePoint,
    { x: Fp2.fromBigTuple([x0, x1]), y: Fp2.fromBigTuple([y0, y1]) },
    x0 === 0n && x1 === 0n && y0 === 0n && y1 === 0n,
  )
}

function checked<point extends G1 | G2>(
  Point: { fromAffine(p: never): point },
  affine: unknown,
  infinity: boolean,
): point {
  if (infinity)
    throw new InvalidPointError({ reason: 'a point is at infinity' })
  const point = Point.fromAffine(affine as never)
  try {
    // Checks the curve equation and, for G2, membership in the prime-order subgroup.
    point.assertValidity()
  } catch {
    throw new InvalidPointError({
      reason: 'a point is not in its prime-order group',
    })
  }
  return point
}

class InvalidPointError extends Errors.BaseError {
  override readonly name = 'Groth16.InvalidPointError'
  readonly reason: string
  constructor({ reason }: { reason: string }) {
    super(`Invalid point: ${reason}.`)
    this.reason = reason
  }
}

/** Thrown when a verifying key is not a valid encoding. */
export class InvalidVerifyingKeyError extends Errors.BaseError {
  override readonly name = 'Groth16.InvalidVerifyingKeyError'
  constructor({ reason }: { reason: string }) {
    super(`The verifying key is invalid: ${reason}.`)
  }
}
