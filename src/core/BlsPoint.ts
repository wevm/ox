import { bls12_381 as bls } from '@noble/curves/bls12-381.js'

import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Branded, Compute } from './internal/types.js'

/** Type for a field element in the base field of the BLS12-381 curve. */
export type Fp = bigint
/** Type for a field element in the extension field of the BLS12-381 curve. */
export type Fp2 = Compute<{ c0: bigint; c1: bigint }>

/** Structured projective form of a BLS point on the G1 or G2 curve. */
export type BlsPoint<type = Fp | Fp2> = Compute<{
  x: type
  y: type
  z: type
}>

/** Branded type for a bytes representation of a G1 point. */
export type G1Bytes = Branded<Bytes.Bytes, 'G1'>
/** Branded type for a hex representation of a G1 point. */
export type G1Hex = Branded<Hex.Hex, 'G1'>

/** Branded type for a bytes representation of a G2 point. */
export type G2Bytes = Branded<Bytes.Bytes, 'G2'>
/** Branded type for a hex representation of a G2 point. */
export type G2Hex = Branded<Hex.Hex, 'G2'>

/** Canonical type for a BLS point on the G1 curve (compressed hex). */
export type G1 = G1Hex
/** Canonical type for a BLS point on the G2 curve (compressed hex). */
export type G2 = G2Hex

/** Structured projective parts of a BLS point on the G1 curve. */
export type G1Parts = BlsPoint<Fp>
/** Structured projective parts of a BLS point on the G2 curve. */
export type G2Parts = BlsPoint<Fp2>

/**
 * Serializes a BLS point to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ### Public Key to Bytes
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * const publicKeyBytes = BlsPoint.toBytes(publicKey)
 * // @log: Uint8Array [172, 175, 255, ...]
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The bytes representation of the BLS point.
 */
export function toBytes<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Bytes : G2Bytes {
  return Bytes.fromHex(point) as never
}

export declare namespace toBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Identity helper: returns the BLS point as {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * const publicKeyHex = BlsPoint.toHex(publicKey)
 * // @log: '0xacafff52270773ad...'
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The hex representation of the BLS point.
 */
export function toHex<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Hex : G2Hex {
  return point as never
}

export declare namespace toHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Deserializes {@link ox#Bytes.Bytes} to a canonical BLS point.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bytes, BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromBytes(Bytes.from([172, 175, 255, ...]), 'G1')
 * // @log: '0xacafff52...' (G1Hex)
 * ```
 *
 * @param bytes - The bytes to convert.
 * @param group - The BLS curve group (`'G1'` or `'G2'`).
 * @returns The canonical BLS point.
 */
export function fromBytes<group extends 'G1' | 'G2'>(
  bytes: Bytes.Bytes,
  group: group,
): group extends 'G1' ? G1 : G2 {
  const expectedLength = group === 'G1' ? 48 : 96
  if (bytes.length !== expectedLength)
    throw new Errors.BaseError(
      `Expected ${expectedLength} bytes for a ${group} point, received ${bytes.length}.`,
    )
  return Hex.fromBytes(bytes) as never
}

export declare namespace fromBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Validates {@link ox#Hex.Hex} as a canonical BLS point.
 *
 * @example
 * ```ts twoslash
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromHex('0xacafff52270773ad1728df2807c0f1b0b271fa6b37dfb8b2f75448573c76c81bcd6790328a60e40ef5a13343b32d9e66', 'G1')
 * // @log: '0xacafff52...' (G1Hex)
 * ```
 *
 * @param hex - The hex to convert.
 * @param group - The BLS curve group (`'G1'` or `'G2'`).
 * @returns The canonical BLS point.
 */
export function fromHex<group extends 'G1' | 'G2'>(
  hex: Hex.Hex,
  group: group,
): group extends 'G1' ? G1 : G2 {
  const expectedLength = group === 'G1' ? 48 : 96
  const actualLength = Hex.size(hex)
  if (actualLength !== expectedLength)
    throw new Errors.BaseError(
      `Expected ${expectedLength} bytes for a ${group} point, received ${actualLength}.`,
    )
  return hex as never
}

export declare namespace fromHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a canonical BLS point ({@link ox#BlsPoint.G1} /
 * {@link ox#BlsPoint.G2}) to its structured projective parts
 * ({@link ox#BlsPoint.G1Parts} / {@link ox#BlsPoint.G2Parts}).
 *
 * @example
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * const parts = BlsPoint.toParts(publicKey)
 * // @log: { x: 172...n, y: 175...n, z: 1n }
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The structured projective parts.
 */
export function toParts<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Parts : G2Parts {
  const bytes = Bytes.fromHex(point)
  const group = bytes.length === 48 ? bls.G1 : bls.G2
  const noblePoint = group.Point.fromBytes(bytes)
  return {
    x: noblePoint.X,
    y: noblePoint.Y,
    z: noblePoint.Z,
  } as never
}

export declare namespace toParts {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts structured projective parts ({@link ox#BlsPoint.G1Parts} or
 * {@link ox#BlsPoint.G2Parts}) into a canonical {@link ox#BlsPoint.G1} or
 * {@link ox#BlsPoint.G2} BLS point.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromParts(
 *   { x: 172n, y: 175n, z: 1n },
 *   'G1',
 * )
 * // @log: '0xacafff52...' (G1Hex)
 * ```
 *
 * @param parts - The structured projective parts to convert.
 * @param group - The BLS curve group (`'G1'` or `'G2'`).
 * @returns The canonical BLS point.
 */
export function fromParts<group extends 'G1' | 'G2'>(
  parts: group extends 'G1' ? G1Parts : G2Parts,
  group: group,
): group extends 'G1' ? G1 : G2 {
  const noblePoint =
    group === 'G1'
      ? new (bls.G1 as any).Point(parts.x, parts.y, parts.z)
      : new (bls.G2 as any).Point(parts.x, parts.y, parts.z)
  return Hex.fromBytes(noblePoint.toBytes()) as never
}

export declare namespace fromParts {
  type ErrorType = Errors.GlobalErrorType
}
