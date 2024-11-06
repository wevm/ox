import type { ProjPointType } from '@noble/curves/abstract/weierstrass'
import { bls12_381 as bls } from '@noble/curves/bls12-381'

import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { OneOf } from './internal/types.js'

export type Fp = bigint
export type Fp2 = { c0: Fp; c1: Fp }

// TODO: move to a `BlsPoint` module?
export type Point<F = Fp> = {
  x: F
  y: F
  z: F
}

export type G1Point = Point<Fp>
export type G2Point = Point<Fp2>

export type Size = 'short-key:long-sig' | 'long-key:short-sig'

/** Re-export of noble/curves BLS12-381 utilities. */
export const noble = bls

/**
 * Aggregates a set of BLS points that are either on the G1 or G2 curves (ie. public keys or signatures).
 *
 * @example
 * ### Aggregating Signatures
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const signatures = [
 *   Bls.sign({ payload: '0x...', privateKey: '0x...' }),
 *   Bls.sign({ payload: '0x...', privateKey: '0x...' }),
 * ]
 * const signature = Bls.aggregate(signatures)
 * ```
 *
 * @example
 * ### Aggregating Public Keys
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const publicKeys = [
 *   Bls.getPublicKey({ privateKey: '0x...' }),
 *   Bls.getPublicKey({ privateKey: '0x...' }),
 * ]
 * const publicKey = Bls.aggregate(publicKeys)
 * ```
 *
 * @param points - The points to aggregate.
 * @returns The aggregated point.
 */
export function aggregate<const points extends readonly Point<Fp | Fp2>[]>(
  points: points,
): points extends readonly Point<Fp>[] ? G1Point : G2Point
//
export function aggregate(points: readonly Point<Fp | Fp2>[]): Point<Fp | Fp2> {
  const group = typeof points[0]?.x === 'bigint' ? bls.G1 : bls.G2
  const point = points.reduce(
    (acc, point) =>
      acc.add(new (group as any).ProjectivePoint(point.x, point.y, point.z)),
    group.ProjectivePoint.ZERO,
  )
  return {
    x: point.px,
    y: point.py,
    z: point.pz,
  }
}

export declare namespace aggregate {
  type ErrorType = Errors.GlobalErrorType
}

aggregate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as aggregate.ErrorType

/**
 * Computes the BLS12-381 public key from a provided private key.
 *
 * Public Keys can be derived as a point on one of the BLS12-381 groups:
 *
 * - G1 Point (Default):
 *   - short (48 bytes)
 *   - computes longer G2 Signatures (96 bytes)
 * - G2 Point:
 *   - long (96 bytes)
 *   - computes short G1 Signatures (48 bytes)
 *
 * @example
 * ### Short G1 Public Keys (Default)
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * //    ^?
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Long G2 Public Keys
 *
 * A G2 Public Key can be derived as a G2 point (96 bytes) using `size: 'long'`.
 *
 * This will allow you to compute G1 Signatures (48 bytes) with {@link ox#Bls.(sign:function)}.
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({
 *   privateKey: '0x...',
 *   size: 'long-key:short-sig',
 * })
 *
 * publicKey
 * // ^?
 *
 *
 *
 *
 *
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<size extends Size = 'short-key:long-sig'>(
  options: getPublicKey.Options<size>,
): size extends 'short-key:long-sig' ? G1Point : G2Point
// eslint-disable-next-line jsdoc/require-jsdoc
export function getPublicKey(options: getPublicKey.Options): Point<Fp | Fp2> {
  const { privateKey, size = 'short-key:long-sig' } = options
  const group = size === 'short-key:long-sig' ? bls.G1 : bls.G2
  const { px, py, pz } = group.ProjectivePoint.fromPrivateKey(
    Hex.from(privateKey).slice(2),
  )
  return { x: px, y: py, z: pz }
}

export declare namespace getPublicKey {
  type Options<size extends Size = 'short-key:long-sig'> = {
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes.Bytes
    /**
     * Size of the public key to compute.
     *
     * - `'short-key:long-sig'`: 48 bytes; computes long signatures (96 bytes)
     * - `'long-key:short-sig'`: 96 bytes; computes short signatures (48 bytes)
     *
     * @default 'short-key:long-sig'
     */
    size?: size | Size | undefined
  }

  type ErrorType = Hex.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Generates a random BLS12-381 private key.
 *
 * @example
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const privateKey = Bls.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = bls.utils.randomPrivateKey()
  if (as === 'Hex') return Hex.fromBytes(bytes) as never
  return bytes as never
}

export declare namespace randomPrivateKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Signs the payload with the provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const signature = Bls.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns BLS Point.
 */
export function sign<size extends Size = 'short-key:long-sig'>(
  options: sign.Options<size>,
): size extends 'short-key:long-sig' ? G2Point : G1Point
export function sign(options: sign.Options): Point<Fp | Fp2> {
  const { payload, privateKey, suite, size = 'short-key:long-sig' } = options

  const payloadGroup = size === 'short-key:long-sig' ? bls.G2 : bls.G1
  const payloadPoint = payloadGroup.hashToCurve(
    Bytes.from(payload),
    suite ? { DST: Bytes.fromString(suite) } : undefined,
  )

  const privateKeyGroup = size === 'short-key:long-sig' ? bls.G1 : bls.G2
  const signature = payloadPoint.multiply(
    privateKeyGroup.normPrivateKeyToScalar(privateKey.slice(2)),
  ) as ProjPointType<Fp | Fp2>

  return {
    x: signature.px,
    y: signature.py,
    z: signature.pz,
  }
}

export declare namespace sign {
  type Options<size extends Size = 'short-key:long-sig'> = {
    /**
     * Payload to sign.
     */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * BLS private key.
     */
    privateKey: Hex.Hex | Bytes.Bytes
    /**
     * Ciphersuite to use for signing. Defaults to "Basic".
     *
     * @see https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#section-4
     * @default 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_'
     */
    suite?: string | undefined
    /**
     * Size of the signature to compute.
     *
     * - `'long-key:short-sig'`: 48 bytes
     * - `'short-key:long-sig'`: 96 bytes
     *
     * @default 'short-key:long-sig'
     */
    size?: size | Size | undefined
  }

  type ErrorType = Bytes.from.ErrorType | Errors.GlobalErrorType
}

sign.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as sign.ErrorType

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const privateKey = Bls.randomPrivateKey()
 * const publicKey = Bls.getPublicKey({ privateKey })
 * const signature = Bls.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = Bls.verify({ // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function verify(options: verify.Options): boolean {
  const { payload, suite } = options

  const publicKey = options.publicKey as unknown as Point<any>
  const signature = options.signature as unknown as Point<any>

  const isShortSig = typeof signature.x === 'bigint'

  const group = isShortSig ? bls.G1 : bls.G2
  const payloadPoint = group.hashToCurve(
    Bytes.from(payload),
    suite ? { DST: Bytes.fromString(suite) } : undefined,
  ) as ProjPointType<any>

  const shortSigPairing = () =>
    bls.pairingBatch([
      {
        g1: payloadPoint,
        g2: new bls.G2.ProjectivePoint(publicKey.x, publicKey.y, publicKey.z),
      },
      {
        g1: new bls.G1.ProjectivePoint(signature.x, signature.y, signature.z),
        g2: bls.G2.ProjectivePoint.BASE.negate(),
      },
    ])

  const longSigPairing = () =>
    bls.pairingBatch([
      {
        g1: new bls.G1.ProjectivePoint(
          publicKey.x,
          publicKey.y,
          publicKey.z,
        ).negate(),
        g2: payloadPoint,
      },
      {
        g1: bls.G1.ProjectivePoint.BASE,
        g2: new bls.G2.ProjectivePoint(signature.x, signature.y, signature.z),
      },
    ])

  return bls.fields.Fp12.eql(
    isShortSig ? shortSigPairing() : longSigPairing(),
    bls.fields.Fp12.ONE,
  )
}

export declare namespace verify {
  type Options = {
    /**
     * Payload that was signed.
     */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Ciphersuite to use for verification. Defaults to "Basic".
     *
     * @see https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#section-4
     * @default 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_'
     */
    suite?: string | undefined
  } & OneOf<
    | {
        publicKey: G1Point
        signature: G2Point
      }
    | {
        publicKey: G2Point
        signature: G1Point
      }
  >

  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
verify.parseError = (error: unknown) => error as verify.ErrorType
