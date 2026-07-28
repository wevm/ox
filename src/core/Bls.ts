import { bls12_381 as bls } from '@noble/curves/bls12-381.js'

import * as BlsPoint from './BlsPoint.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as engine from './internal/bls.js'
import type { OneOf } from './internal/types.js'

/** @internal */
function formatBlsPoint(
  point: Bytes.Bytes,
  group: 'G1' | 'G2',
  as: 'Hex' | 'Bytes' | 'Object',
): unknown {
  if (as === 'Hex') return Hex.fromBytes(point)
  if (as === 'Bytes') return point
  return BlsPoint.fromBytes(point, group)
}

/** @internal */
function serializeBlsPoint(
  point: Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint,
): Bytes.Bytes {
  if (typeof point === 'string') return Hex.toBytes(point)
  if (point instanceof Uint8Array) return point
  return BlsPoint.toBytes(point as BlsPoint.G1 | BlsPoint.G2)
}

/** @internal */
function validateSerializedBlsPoint(
  point: Hex.Hex | Bytes.Bytes,
  group: 'G1' | 'G2',
): void {
  if (typeof point === 'string') BlsPoint.fromHex(point, group)
  else BlsPoint.fromBytes(point, group)
}

/** @internal */
function assertBlsPointSize(
  point: Bytes.Bytes,
  group: 'G1' | 'G2',
): Bytes.Bytes {
  const expectedLength = group === 'G1' ? 48 : 96
  if (point.length !== expectedLength)
    throw new Errors.BaseError(
      `Expected ${expectedLength} bytes for a ${group} point, received ${point.length}.`,
    )
  return point
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
 *   Bls.sign({ payload, privateKey: '0x...' })
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
 *   Bls.getPublicKey({ privateKey: '0x...' })
 * ]
 * const publicKey = Bls.aggregate(publicKeys)
 * ```
 *
 * @param points - The points to aggregate.
 * @returns The aggregated point.
 */
export function aggregate<const points extends readonly BlsPoint.BlsPoint[]>(
  points: points,
): points extends readonly BlsPoint.G1[] ? BlsPoint.G1 : BlsPoint.G2
export function aggregate(
  points: readonly (Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint)[],
  options?: aggregate.Options,
): BlsPoint.BlsPoint
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function aggregate(
  points: readonly (Hex.Hex | Bytes.Bytes | BlsPoint.BlsPoint)[],
  options: aggregate.Options = {},
): BlsPoint.BlsPoint {
  if (points.length === 0)
    throw new Errors.BaseError(
      'Bls.aggregate expects a non-empty array of points.',
    )

  const groupHint = options.group
  const groups = points.map((point) => {
    if (typeof point === 'string' || point instanceof Uint8Array) {
      if (!groupHint)
        throw new Errors.BaseError(
          'Bls.aggregate requires `options.group` (`"G1"` or `"G2"`) when passing serialized points.',
        )
      return groupHint
    }
    return typeof point.x === 'string' ? 'G1' : 'G2'
  })

  // A single point aggregates to itself. The engine is not consulted because
  // there is no addition to perform, only the identity.
  if (points.length === 1) {
    const point = points[0]!
    if (typeof point === 'string')
      return BlsPoint.fromHex(point, groups[0]!) as BlsPoint.BlsPoint
    if (point instanceof Uint8Array)
      return BlsPoint.fromBytes(point, groups[0]!) as BlsPoint.BlsPoint
    return point
  }

  const groupName = groups[0]!
  for (let i = 1; i < groups.length; i++) {
    if (groups[i] !== groupName) {
      // Preserve eager serialized validation on this error path. Valid inputs
      // stay serialized, while malformed inputs still win over the mixed-group
      // error in their original array order.
      for (const [index, point] of points.entries()) {
        if (typeof point === 'string') BlsPoint.fromHex(point, groups[index]!)
        else if (point instanceof Uint8Array)
          BlsPoint.fromBytes(point, groups[index]!)
      }
      throw new Errors.BaseError(
        'Bls.aggregate expects all points to be from the same group (G1 or G2).',
      )
    }
  }

  // The previous implementation decoded every serialized member before
  // serializing structured members. Retain that error order only for mixed
  // representations; fully serialized arrays stay on the fast path.
  const hasStructured = points.some(
    (point) => typeof point !== 'string' && !(point instanceof Uint8Array),
  )
  if (hasStructured)
    for (const point of points)
      if (typeof point === 'string' || point instanceof Uint8Array)
        validateSerializedBlsPoint(point, groupName)

  const serialized: Bytes.Bytes[] = []
  for (const [index, point] of points.entries()) {
    try {
      serialized.push(assertBlsPointSize(serializeBlsPoint(point), groupName))
    } catch (error) {
      // A later cheap serialization error must not outrank an earlier
      // malformed point. Decode only the failed prefix on this error path.
      if (!hasStructured)
        for (let i = 0; i <= index; i++)
          validateSerializedBlsPoint(
            points[i] as Hex.Hex | Bytes.Bytes,
            groupName,
          )
      throw error
    }
  }

  const point = engine.aggregate(serialized, groupName)
  return BlsPoint.fromBytes(point, groupName) as BlsPoint.BlsPoint
}

export declare namespace aggregate {
  type Options = {
    /**
     * Curve group of the input points. Required when any input is serialized
     * (`Hex.Hex` or `Uint8Array`); ignored when all inputs are structured
     * {@link ox#BlsPoint.BlsPoint}.
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
 * //      ^?
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
 *   size: 'long-key:short-sig'
 * })
 *
 * publicKey
 * // ^?
 * ```
 *
 * ### Serializing
 *
 * Public Keys can be serialized to hex or bytes using {@link ox#BlsPoint.(toHex:function)} or {@link ox#BlsPoint.(toBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const { publicKey } = Bls.createKeyPair()
 *
 * const publicKeyHex = BlsPoint.toHex(publicKey)
 * //    ^?
 *
 * const publicKeyBytes = BlsPoint.toBytes(publicKey)
 * //    ^?
 * ```
 *
 * They can also be deserialized from hex or bytes using {@link ox#BlsPoint.(fromHex:function)} or {@link ox#BlsPoint.(fromBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKeyHex = '0x...'
 *
 * const publicKey = BlsPoint.fromHex(publicKeyHex, 'G1')
 * //    ^?
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
 * const publicKey = Bls.getPublicKey({
 *   privateKey: '0x...',
 *   size: 'long-key:short-sig'
 * })
 *
 * publicKey
 * // ^?
 * ```
 *
 * ### Serializing
 *
 * Public Keys can be serialized to hex or bytes using {@link ox#BlsPoint.(toHex:function)} or {@link ox#BlsPoint.(toBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 *
 * const publicKeyHex = BlsPoint.toHex(publicKey)
 * //    ^?
 *
 * const publicKeyBytes = BlsPoint.toBytes(publicKey)
 * //    ^?
 * ```
 *
 * They can also be deserialized from hex or bytes using {@link ox#BlsPoint.(fromHex:function)} or {@link ox#BlsPoint.(fromBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKeyHex = '0x...'
 *
 * const publicKey = BlsPoint.fromHex(publicKeyHex, 'G1')
 * //    ^?
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<
  as extends 'Hex' | 'Bytes' | 'Object' = 'Object',
  size extends Size = 'short-key:long-sig',
>(options: getPublicKey.Options<as, size>): getPublicKey.ReturnType<as, size>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function getPublicKey(options: getPublicKey.Options): unknown {
  const { as = 'Object', privateKey, size = 'short-key:long-sig' } = options
  const groupName = size === 'short-key:long-sig' ? 'G1' : 'G2'
  const point = assertBlsPointSize(
    engine.getPublicKey(Bytes.from(privateKey), groupName),
    groupName,
  )
  return formatBlsPoint(point, groupName, as)
}

export declare namespace getPublicKey {
  type Options<
    as extends 'Hex' | 'Bytes' | 'Object' = 'Object',
    size extends Size = 'short-key:long-sig',
  > = {
    /**
     * Format of the returned public key.
     * @default 'Object'
     */
    as?: as | 'Hex' | 'Bytes' | 'Object' | undefined
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

  type ReturnType<as extends 'Hex' | 'Bytes' | 'Object', size extends Size> =
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
    | (as extends 'Object'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G1
          : BlsPoint.G2
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
  const bytes = engine.randomSecretKey()
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
 *   // [!code focus]
 *   payload: Hex.random(32), // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### Serializing
 *
 * Signatures can be serialized to hex or bytes using {@link ox#BlsPoint.(toHex:function)} or {@link ox#BlsPoint.(toBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint, Hex } from 'ox'
 *
 * const signature = Bls.sign({
 *   payload: Hex.random(32),
 *   privateKey: '0x...'
 * })
 *
 * const signatureHex = BlsPoint.toHex(signature)
 * //    ^?
 *
 * const signatureBytes = BlsPoint.toBytes(signature)
 * //    ^?
 * ```
 *
 * They can also be deserialized from hex or bytes using {@link ox#BlsPoint.(fromHex:function)} or {@link ox#BlsPoint.(fromBytes:function)}:
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const signatureHex = '0x...'
 *
 * const signature = BlsPoint.fromHex(signatureHex, 'G2')
 * //    ^?
 * ```
 *
 * @param options - The signing options.
 * @returns BLS Point.
 */
export function sign<
  as extends 'Hex' | 'Bytes' | 'Object' = 'Object',
  size extends Size = 'short-key:long-sig',
>(options: sign.Options<as, size>): sign.ReturnType<as, size>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function sign(options: sign.Options): unknown {
  const {
    as = 'Object',
    payload,
    privateKey,
    suite,
    size = 'short-key:long-sig',
  } = options

  const signatureGroupName: 'G1' | 'G2' =
    size === 'short-key:long-sig' ? 'G2' : 'G1'
  const signature = assertBlsPointSize(
    engine.sign(Bytes.from(payload), Bytes.from(privateKey), {
      dst: suite ? Bytes.fromString(suite) : undefined,
      group: signatureGroupName,
    }),
    signatureGroupName,
  )
  return formatBlsPoint(signature, signatureGroupName, as)
}

export declare namespace sign {
  type Options<
    as extends 'Hex' | 'Bytes' | 'Object' = 'Object',
    size extends Size = 'short-key:long-sig',
  > = {
    /**
     * Format of the returned signature.
     * @default 'Object'
     */
    as?: as | 'Hex' | 'Bytes' | 'Object' | undefined
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

  type ReturnType<as extends 'Hex' | 'Bytes' | 'Object', size extends Size> =
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
    | (as extends 'Object'
        ? size extends 'short-key:long-sig'
          ? BlsPoint.G2
          : BlsPoint.G1
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
 *   // [!code focus]
 *   payload, // [!code focus]
 *   publicKey, // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### Verify Aggregated Signatures
 *
 * We can also pass a public key and signature that was aggregated with {@link ox#Bls.(aggregate:function)} to `Bls.verify`.
 *
 * ```ts twoslash
 * import { Bls, Hex } from 'ox'
 *
 * const payload = Hex.random(32)
 * const privateKeys = Array.from({ length: 100 }, () =>
 *   Bls.randomPrivateKey()
 * )
 *
 * const publicKeys = privateKeys.map((privateKey) =>
 *   Bls.getPublicKey({ privateKey })
 * )
 * const signatures = privateKeys.map((privateKey) =>
 *   Bls.sign({ payload, privateKey })
 * )
 *
 * const publicKey = Bls.aggregate(publicKeys) // [!code focus]
 * const signature = Bls.aggregate(signatures) // [!code focus]
 *
 * const valid = Bls.verify({ payload, publicKey, signature }) // [!code focus]
 * ```
 *
 * @param options - Verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function verify(options: verify.Options): boolean {
  const { payload, suite } = options

  // Accept structured / hex / bytes inputs. Inspect the *signature* group
  // first when structured, otherwise fall back to the explicit `group` /
  // pair-shape hint to know how to deserialize.
  const signatureRaw = options.signature
  const publicKeyRaw = options.publicKey

  // If signature is structured, infer signature group via field shape.
  const signatureIsStructured =
    typeof signatureRaw === 'object' &&
    !(signatureRaw instanceof Uint8Array) &&
    'z' in signatureRaw
  const publicKeyIsStructured =
    typeof publicKeyRaw === 'object' &&
    !(publicKeyRaw instanceof Uint8Array) &&
    'z' in publicKeyRaw

  // Determine signature group: G1 (short sig, x is hex string) or G2 (long
  // sig, x is `{ c0, c1 }`). For serialized signatures, infer from the
  // byte/hex length.
  const signatureGroup: 'G1' | 'G2' = signatureIsStructured
    ? typeof (signatureRaw as BlsPoint.BlsPoint).x === 'string'
      ? 'G1'
      : 'G2'
    : signatureByteLength(signatureRaw as Hex.Hex | Bytes.Bytes) === 48
      ? 'G1'
      : 'G2'
  const publicKeyGroup = signatureGroup === 'G1' ? 'G2' : 'G1'

  // Preserve the previous eager validation order when representations are
  // mixed. Fully serialized pairs stay serialized until the provider.
  if (signatureIsStructured !== publicKeyIsStructured) {
    if (!signatureIsStructured)
      validateSerializedBlsPoint(
        signatureRaw as Hex.Hex | Bytes.Bytes,
        signatureGroup,
      )
    if (!publicKeyIsStructured)
      validateSerializedBlsPoint(
        publicKeyRaw as Hex.Hex | Bytes.Bytes,
        publicKeyGroup,
      )
  }

  const signature = signatureIsStructured
    ? BlsPoint.toBytes(signatureRaw as BlsPoint.G1 | BlsPoint.G2)
    : assertBlsPointSize(
        Bytes.from(signatureRaw as Hex.Hex | Bytes.Bytes),
        signatureGroup,
      )
  let payloadBytes: Bytes.Bytes
  try {
    payloadBytes = Bytes.from(payload)
  } catch (error) {
    // Serialized points used to be decoded before payload coercion. Only pay
    // that cost on this invalid-payload path so their errors still win.
    if (!signatureIsStructured && !publicKeyIsStructured) {
      validateSerializedBlsPoint(
        signatureRaw as Hex.Hex | Bytes.Bytes,
        signatureGroup,
      )
      validateSerializedBlsPoint(
        publicKeyRaw as Hex.Hex | Bytes.Bytes,
        publicKeyGroup,
      )
    }
    throw error
  }
  let publicKey: Bytes.Bytes
  try {
    publicKey = publicKeyIsStructured
      ? BlsPoint.toBytes(publicKeyRaw as BlsPoint.G1 | BlsPoint.G2)
      : assertBlsPointSize(
          Bytes.from(publicKeyRaw as Hex.Hex | Bytes.Bytes),
          publicKeyGroup,
        )
  } catch (error) {
    // As above, a later cheap public-key error must not outrank a malformed
    // serialized signature.
    if (!signatureIsStructured && !publicKeyIsStructured) {
      validateSerializedBlsPoint(
        signatureRaw as Hex.Hex | Bytes.Bytes,
        signatureGroup,
      )
      validateSerializedBlsPoint(
        publicKeyRaw as Hex.Hex | Bytes.Bytes,
        publicKeyGroup,
      )
    }
    throw error
  }

  return engine.verify(signature, payloadBytes, publicKey, {
    dst: suite ? Bytes.fromString(suite) : undefined,
    signatureGroup,
  })
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
         * Public key (G1). Accepts a structured {@link ox#BlsPoint.G1}, a hex
         * string, or a `Uint8Array`.
         */
        publicKey: Hex.Hex | Bytes.Bytes | BlsPoint.G1
        /**
         * Signature (G2). Accepts a structured {@link ox#BlsPoint.G2}, a hex
         * string, or a `Uint8Array`.
         */
        signature: Hex.Hex | Bytes.Bytes | BlsPoint.G2
      }
    | {
        /**
         * Public key (G2). Accepts a structured {@link ox#BlsPoint.G2}, a hex
         * string, or a `Uint8Array`.
         */
        publicKey: Hex.Hex | Bytes.Bytes | BlsPoint.G2
        /**
         * Signature (G1). Accepts a structured {@link ox#BlsPoint.G1}, a hex
         * string, or a `Uint8Array`.
         */
        signature: Hex.Hex | Bytes.Bytes | BlsPoint.G1
      }
  >

  type ErrorType = Errors.GlobalErrorType
}
