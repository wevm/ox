import { bls12_381 as bls } from '@noble/curves/bls12-381.js'

import * as BlsPoint from './BlsPoint.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { OneOf } from './internal/types.js'

/**
 * Coerces a serialized or structured BLS point into a noble Point.
 *
 * @internal
 */
function toNoblePoint<group extends 'G1' | 'G2'>(
  value: Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint,
  group: group,
): InstanceType<
  group extends 'G1' ? typeof bls.G1.Point : typeof bls.G2.Point
> {
  const G = group === 'G1' ? bls.G1 : bls.G2
  if (value instanceof Uint8Array) return G.Point.fromBytes(value) as never
  if (typeof value === 'string')
    return G.Point.fromBytes(Bytes.fromHex(value as Hex.Hex)) as never
  return new (G as any).Point(value.x, value.y, value.z)
}

/**
 * Encodes a noble BLS point as the requested representation.
 *
 * @internal
 */
function formatBlsPoint(
  point: { toBytes(): Uint8Array },
  as: 'Hex' | 'Bytes',
): unknown {
  const bytes = point.toBytes()
  if (as === 'Bytes') return bytes
  return Hex.fromBytes(bytes)
}

/**
 * Returns the byte length of a serialized BLS point. Hex strings are measured
 * minus the `0x` prefix, divided by two; `Uint8Array`s use `byteLength`.
 *
 * @internal
 */
function signatureByteLength(value: Hex.Hex | Bytes.Bytes): number {
  if (typeof value === 'string') return (value.length - 2) / 2
  return value.byteLength
}

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
 * import { Bls, Hex } from 'ox'
 *
 * const payload = Hex.random(32)
 *
 * const signatures = [
 *   Bls.sign({ payload, privateKey: '0x...' }),
 *   Bls.sign({ payload, privateKey: '0x...' }),
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
 * @param options - Aggregation options.
 * @returns The aggregated point.
 */
export function aggregate<const points extends readonly BlsPoint.BlsPoint[]>(
  points: points,
): points extends readonly BlsPoint.G1Parts[] ? BlsPoint.G1 : BlsPoint.G2
export function aggregate<
  const points extends readonly (BlsPoint.G1 | BlsPoint.G2)[],
>(
  points: points,
): points extends readonly BlsPoint.G1[] ? BlsPoint.G1 : BlsPoint.G2
export function aggregate(
  points: readonly (Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint)[],
  options?: aggregate.Options,
): Hex.Hex
// eslint-disable-next-line jsdoc/require-jsdoc
export function aggregate(
  points: readonly (Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint)[],
  options: aggregate.Options = {},
): unknown {
  if (points.length === 0)
    throw new Errors.BaseError(
      'Bls.aggregate expects a non-empty array of points.',
    )

  // Determine group: structured -> field shape; serialized -> byte length / hint.
  const first = points[0]!
  const group: 'G1' | 'G2' = (() => {
    if (typeof first === 'string' || first instanceof Uint8Array) {
      const len = signatureByteLength(first as Hex.Hex | Bytes.Bytes)
      if (options.group) return options.group
      if (len === 48) return 'G1'
      if (len === 96) return 'G2'
      throw new Errors.BaseError(
        `Bls.aggregate could not infer the curve group for a point of ${len} bytes; specify \`options.group\`.`,
      )
    }
    return typeof first.x === 'bigint' ? 'G1' : 'G2'
  })()

  const G = (group === 'G1' ? bls.G1 : bls.G2) as any
  const PointCtor = G.Point
  let acc: any = PointCtor.ZERO
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    if (p instanceof Uint8Array) {
      acc = acc.add(PointCtor.fromBytes(p))
    } else if (typeof p === 'string') {
      acc = acc.add(PointCtor.fromBytes(Bytes.fromHex(p as Hex.Hex)))
    } else {
      acc = acc.add(new PointCtor(p.x, p.y, p.z))
    }
  }
  return Hex.fromBytes(acc.toBytes())
}

export declare namespace aggregate {
  type Options = {
    /**
     * Curve group of the input points. Required when any input is serialized
     * (`Hex.Hex` or `Uint8Array`) and the byte length is non-standard.
     */
    group?: 'G1' | 'G2' | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Creates a new BLS12-381 key pair consisting of a private key and its corresponding public key.
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
 * const { publicKey } = Bls.createKeyPair()
 * ```
 *
 * @example
 * ### Long G2 Public Keys
 *
 * A G2 Public Key can be derived as a G2 point (96 bytes) using `size: 'long-key:short-sig'`.
 *
 * This will allow you to compute G1 Signatures (48 bytes) with {@link ox#Bls.(sign:function)}.
 *
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const { publicKey } = Bls.createKeyPair({
 *   size: 'long-key:short-sig',
 * })
 * ```
 *
 * @param options - The options to generate the key pair.
 * @returns The generated key pair containing both private and public keys.
 */
export function createKeyPair<
  as extends 'Hex' | 'Bytes' = 'Hex',
  size extends Size = 'short-key:long-sig',
>(
  options: createKeyPair.Options<as, size> = {},
): createKeyPair.ReturnType<as, size> {
  const { as = 'Hex', size = 'short-key:long-sig' } = options
  const privateKey = randomPrivateKey({ as })
  const publicKey = getPublicKey({ privateKey, size })

  return {
    privateKey: privateKey as never,
    publicKey: publicKey as never,
  }
}

export declare namespace createKeyPair {
  type Options<
    as extends 'Hex' | 'Bytes' = 'Hex',
    size extends Size = 'short-key:long-sig',
  > = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
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

  type ReturnType<as extends 'Hex' | 'Bytes', size extends Size> = {
    privateKey:
      | (as extends 'Bytes' ? Bytes.Bytes : never)
      | (as extends 'Hex' ? Hex.Hex : never)
    publicKey: size extends 'short-key:long-sig' ? BlsPoint.G1 : BlsPoint.G2
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | getPublicKey.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the BLS12-381 public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Bls } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<
  as extends 'Hex' | 'Bytes' = 'Hex',
  size extends Size = 'short-key:long-sig',
>(options: getPublicKey.Options<as, size>): getPublicKey.ReturnType<as, size>
// eslint-disable-next-line jsdoc/require-jsdoc
export function getPublicKey(options: getPublicKey.Options): unknown {
  const { as = 'Hex', privateKey, size = 'short-key:long-sig' } = options
  const group = size === 'short-key:long-sig' ? bls.G1 : bls.G2
  const point = group.Point.BASE.multiply(
    group.Point.Fn.fromBytes(Bytes.from(privateKey)),
  )
  return formatBlsPoint(point, as)
}

export declare namespace getPublicKey {
  type Options<
    as extends 'Hex' | 'Bytes' = 'Hex',
    size extends Size = 'short-key:long-sig',
  > = {
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
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

  type ReturnType<as extends 'Hex' | 'Bytes', size extends Size> =
    | (as extends 'Bytes'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G1Bytes
          : BlsPoint.G2Bytes
        : never)
    | (as extends 'Hex'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G1Hex
          : BlsPoint.G2Hex
        : never)

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
  const bytes = bls.utils.randomSecretKey()
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
 * import { Bls, Hex } from 'ox'
 *
 * const signature = Bls.sign({
 *   payload: Hex.random(32),
 *   privateKey: '0x...'
 * })
 * ```
 *
 * @param options - The signing options.
 * @returns BLS Point.
 */
export function sign<
  as extends 'Hex' | 'Bytes' = 'Hex',
  size extends Size = 'short-key:long-sig',
>(options: sign.Options<as, size>): sign.ReturnType<as, size>
// eslint-disable-next-line jsdoc/require-jsdoc
export function sign(options: sign.Options): unknown {
  const {
    as = 'Hex',
    payload,
    privateKey,
    suite,
    size = 'short-key:long-sig',
  } = options

  const payloadGroup = size === 'short-key:long-sig' ? bls.G2 : bls.G1
  const payloadPoint = payloadGroup.hashToCurve(
    Bytes.from(payload),
    suite ? { DST: Bytes.fromString(suite) } : undefined,
  )

  const privateKeyGroup = size === 'short-key:long-sig' ? bls.G1 : bls.G2
  const signature = payloadPoint.multiply(
    privateKeyGroup.Point.Fn.fromBytes(Bytes.from(privateKey)),
  )

  return formatBlsPoint(signature, as)
}

export declare namespace sign {
  type Options<
    as extends 'Hex' | 'Bytes' = 'Hex',
    size extends Size = 'short-key:long-sig',
  > = {
    /**
     * Format of the returned signature.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
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

  type ReturnType<as extends 'Hex' | 'Bytes', size extends Size> =
    | (as extends 'Bytes'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G2Bytes
          : BlsPoint.G1Bytes
        : never)
    | (as extends 'Hex'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G2Hex
          : BlsPoint.G1Hex
        : never)

  type ErrorType = Bytes.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided public key(s).
 *
 * @example
 *
 * ```ts twoslash
 * import { Bls, Hex } from 'ox'
 *
 * const payload = Hex.random(32)
 * const privateKey = Bls.randomPrivateKey()
 *
 * const publicKey = Bls.getPublicKey({ privateKey })
 * const signature = Bls.sign({ payload, privateKey })
 *
 * const verified = Bls.verify({
 *   payload,
 *   publicKey,
 *   signature,
 * })
 * ```
 *
 * @param options - Verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function verify(options: verify.Options): boolean {
  const { payload, suite } = options

  // Accept structured / hex / bytes inputs. Inspect the *signature* group
  // first when structured, otherwise fall back to length-based detection.
  const signatureRaw = options.signature
  const publicKeyRaw = options.publicKey

  const signatureIsStructured =
    typeof signatureRaw === 'object' &&
    !(signatureRaw instanceof Uint8Array) &&
    'z' in (signatureRaw as object)

  const signatureGroup: 'G1' | 'G2' = signatureIsStructured
    ? typeof (signatureRaw as BlsPoint.BlsPoint).x === 'bigint'
      ? 'G1'
      : 'G2'
    : signatureByteLength(signatureRaw as Hex.Hex | Bytes.Bytes) === 48
      ? 'G1'
      : 'G2'
  const publicKeyGroup: 'G1' | 'G2' = signatureGroup === 'G1' ? 'G2' : 'G1'

  const signaturePoint = toNoblePoint(
    signatureRaw as Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint,
    signatureGroup,
  )
  const publicKeyPoint = toNoblePoint(
    publicKeyRaw as Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint,
    publicKeyGroup,
  )

  const isShortSig = signatureGroup === 'G1'

  const group = isShortSig ? bls.G1 : bls.G2
  const payloadPoint = group.hashToCurve(
    Bytes.from(payload),
    suite ? { DST: Bytes.fromString(suite) } : undefined,
  )

  const shortSigPairing = () =>
    bls.pairingBatch([
      {
        g1: payloadPoint as InstanceType<typeof bls.G1.Point>,
        g2: publicKeyPoint as InstanceType<typeof bls.G2.Point>,
      },
      {
        g1: signaturePoint as InstanceType<typeof bls.G1.Point>,
        g2: bls.G2.Point.BASE.negate(),
      },
    ])

  const longSigPairing = () =>
    bls.pairingBatch([
      {
        g1: (publicKeyPoint as InstanceType<typeof bls.G1.Point>).negate(),
        g2: payloadPoint as InstanceType<typeof bls.G2.Point>,
      },
      {
        g1: bls.G1.Point.BASE,
        g2: signaturePoint as InstanceType<typeof bls.G2.Point>,
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
        /**
         * Public key (G1). Accepts a canonical {@link ox#BlsPoint.G1} (hex), a
         * `Uint8Array`, or a structured {@link ox#BlsPoint.G1Parts}.
         */
        publicKey: Hex.Hex | Bytes.Bytes | BlsPoint.G1Parts
        /**
         * Signature (G2). Accepts a canonical {@link ox#BlsPoint.G2} (hex), a
         * `Uint8Array`, or a structured {@link ox#BlsPoint.G2Parts}.
         */
        signature: Hex.Hex | Bytes.Bytes | BlsPoint.G2Parts
      }
    | {
        /**
         * Public key (G2). Accepts a canonical {@link ox#BlsPoint.G2} (hex), a
         * `Uint8Array`, or a structured {@link ox#BlsPoint.G2Parts}.
         */
        publicKey: Hex.Hex | Bytes.Bytes | BlsPoint.G2Parts
        /**
         * Signature (G1). Accepts a canonical {@link ox#BlsPoint.G1} (hex), a
         * `Uint8Array`, or a structured {@link ox#BlsPoint.G1Parts}.
         */
        signature: Hex.Hex | Bytes.Bytes | BlsPoint.G1Parts
      }
  >

  type ErrorType = Errors.GlobalErrorType
}
