import { bls12_381 as bls } from '@noble/curves/bls12-381.js'

import type * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Branded, Compute } from './internal/types.js'

/** Type for a field element in the base field of the BLS12-381 curve. */
export type Fp = bigint
/** Type for a field element in the extension field of the BLS12-381 curve. */
export type Fp2 = Compute<{ c0: bigint; c1: bigint }>

/** Root type for a BLS point on the G1 or G2 curve. */
export type BlsPoint<type = Fp | Fp2> = Compute<{
  x: type
  y: type
  z: type
}>

/** Type for a BLS point on the G1 curve. */
export type G1 = BlsPoint<Fp>
/** Branded type for a bytes representation of a G1 point. */
export type G1Bytes = Branded<Bytes.Bytes, 'G1'>
/** Branded type for a hex representation of a G1 point. */
export type G1Hex = Branded<Hex.Hex, 'G1'>

/** Type for a BLS point on the G2 curve. */
export type G2 = BlsPoint<Fp2>
/** Branded type for a bytes representation of a G2 point. */
export type G2Bytes = Branded<Bytes.Bytes, 'G2'>
/** Branded type for a hex representation of a G2 point. */
export type G2Hex = Branded<Hex.Hex, 'G2'>

/**
 * Structured projective parts of a BLS point on the G1 curve.
 *
 * @remarks
 * In a future major (`1.0`), {@link ox#BlsPoint.G1} will be flipped to a
 * branded {@link ox#BlsPoint.G1Hex} string and this `Parts` type will represent
 * the structured projective form. Today, `G1Parts` is structurally equivalent
 * to `G1` -- prefer it in new code so the upgrade path is a no-op.
 */
export type G1Parts = BlsPoint<Fp>

/**
 * Structured projective parts of a BLS point on the G2 curve.
 *
 * @remarks
 * In a future major (`1.0`), {@link ox#BlsPoint.G2} will be flipped to a
 * branded {@link ox#BlsPoint.G2Hex} string and this `Parts` type will represent
 * the structured projective form. Today, `G2Parts` is structurally equivalent
 * to `G2` -- prefer it in new code so the upgrade path is a no-op.
 */
export type G2Parts = BlsPoint<Fp2>

/**
 * Converts a BLS point to {@link ox#Bytes.Bytes}.
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
 * @example
 * ### Signature to Bytes
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const signature = Bls.sign({ payload: '0x...', privateKey: '0x...' })
 * const signatureBytes = BlsPoint.toBytes(signature)
 * // @log: Uint8Array [172, 175, 255, ...]
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The bytes representation of the BLS point.
 */
export function toBytes<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Bytes : G2Bytes {
  const group = typeof point.z === 'bigint' ? bls.G1 : bls.G2
  return new (group as any).Point(point.x, point.y, point.z).toBytes()
}

export declare namespace toBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a BLS point to {@link ox#Hex.Hex}.
 *
 * @example
 * ### Public Key to Hex
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * const publicKeyHex = BlsPoint.toHex(publicKey)
 * // @log: '0xacafff52270773ad1728df2807c0f1b0b271fa6b37dfb8b2f75448573c76c81bcd6790328a60e40ef5a13343b32d9e66'
 * ```
 *
 * @example
 * ### Signature to Hex
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const signature = Bls.sign({ payload: '0x...', privateKey: '0x...' })
 * const signatureHex = BlsPoint.toHex(signature)
 * // @log: '0xb4698f7611999fba87033b9cf72312c76c683bbc48175e2d4cb275907d6a267ab9840a66e3051e5ed36fd13aa712f9a9024f9fa9b67f716dfb74ae4efb7d9f1b7b43b4679abed6644cf476c12e79f309351ea8452487cd93f66e29e04ebe427c'
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The hex representation of the BLS point.
 */
export function toHex<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Hex : G2Hex
// eslint-disable-next-line jsdoc/require-jsdoc
export function toHex(point: G1 | G2): Hex.Hex {
  return Hex.fromBytes(toBytes(point))
}

export declare namespace toHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts {@link ox#Bytes.Bytes} to a BLS point.
 *
 * @example
 * ### Bytes to Public Key
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromBytes(Bytes.from([172, 175, 255, ...]), 'G1')
 * // @log: {
 * // @log:   x: 172...n,
 * // @log:   y: 175...n,
 * // @log:   z: 1n,
 * // @log: }
 * ```
 *
 * @example
 * ### Bytes to Signature
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const signature = BlsPoint.fromBytes(Bytes.from([172, 175, 255, ...]), 'G2')
 * // @log: {
 * // @log:   x: 511...n,
 * // @log:   y: 234...n,
 * // @log:   z: 1n,
 * // @log: }
 * ```
 *
 * @param bytes - The bytes to convert.
 * @returns The BLS point.
 */
export function fromBytes<group extends 'G1' | 'G2'>(
  bytes: Bytes.Bytes,
  group: group,
): group extends 'G1' ? G1 : G2
// eslint-disable-next-line jsdoc/require-jsdoc
export function fromBytes(
  bytes: Bytes.Bytes,
  group: 'G1' | 'G2',
): BlsPoint<any> {
  const expectedLength = group === 'G1' ? 48 : 96
  if (bytes.length !== expectedLength)
    throw new Errors.BaseError(
      `Expected ${expectedLength} bytes for a ${group} point, received ${bytes.length}.`,
    )
  const Group = group === 'G1' ? bls.G1 : bls.G2
  const point = Group.Point.fromBytes(bytes)
  return {
    x: point.X,
    y: point.Y,
    z: point.Z,
  }
}

export declare namespace fromBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts {@link ox#Hex.Hex} to a BLS point.
 *
 * @example
 * ### Hex to Public Key
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromHex('0xacafff52270773ad1728df2807c0f1b0b271fa6b37dfb8b2f75448573c76c81bcd6790328a60e40ef5a13343b32d9e66', 'G1')
 * // @log: {
 * // @log:   x: 172...n,
 * // @log:   y: 175...n,
 * // @log:   z: 1n,
 * // @log: }
 * ```
 *
 * @example
 * ### Hex to Signature
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const signature = BlsPoint.fromHex(
 *   '0xb4698f7611999fba87033b9cf72312c76c683bbc48175e2d4cb275907d6a267ab9840a66e3051e5ed36fd13aa712f9a9024f9fa9b67f716dfb74ae4efb7d9f1b7b43b4679abed6644cf476c12e79f309351ea8452487cd93f66e29e04ebe427c',
 *   'G2',
 * )
 * // @log: {
 * // @log:   x: 511...n,
 * // @log:   y: 234...n,
 * // @log:   z: 1n,
 * // @log: }
 * ```
 *
 * @param bytes - The bytes to convert.
 * @returns The BLS point.
 */
export function fromHex<group extends 'G1' | 'G2'>(
  hex: Hex.Hex,
  group: group,
): group extends 'G1' ? G1 : G2
// eslint-disable-next-line jsdoc/require-jsdoc
export function fromHex(hex: Hex.Hex, group: 'G1' | 'G2'): BlsPoint<any> {
  return fromBytes(Hex.toBytes(hex), group)
}

export declare namespace fromHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a BLS point to its structured projective {@link ox#BlsPoint.G1Parts}
 * / {@link ox#BlsPoint.G2Parts} form.
 *
 * @remarks
 * Today this is a structural pass-through (the root `BlsPoint` is already the
 * projective object). In a future major, `G1` / `G2` will be branded
 * `Hex.Hex` strings and this codec will decode into the parts form by
 * delegating through {@link ox#BlsPoint.(toBytes:function)} /
 * {@link ox#BlsPoint.(fromBytes:function)}. Migrating call sites to `toParts`
 * / `fromParts` now keeps that upgrade a no-op.
 *
 * @example
 * ### Public Key to Parts
 *
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
  // Today the root `BlsPoint` is already the projective object form -- copy
  // the fields so callers don't accidentally mutate the input. In the future
  // major, this becomes `fromBytes(toBytes(point))`.
  return { x: point.x, y: point.y, z: point.z } as never
}

export declare namespace toParts {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts structured projective parts ({@link ox#BlsPoint.G1Parts} or
 * {@link ox#BlsPoint.G2Parts}) into a {@link ox#BlsPoint.G1} or
 * {@link ox#BlsPoint.G2} BLS point.
 *
 * @remarks
 * Today this is a structural pass-through. In a future major, the BLS point
 * root types will be branded `Hex.Hex` strings; this codec will then encode
 * the parts via {@link ox#BlsPoint.(toBytes:function)}.
 *
 * @example
 * ### Parts to Public Key
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromParts(
 *   { x: 172n, y: 175n, z: 1n },
 *   'G1',
 * )
 * // @log: { x: 172n, y: 175n, z: 1n }
 * ```
 *
 * @param parts - The structured projective parts to convert.
 * @param group - The BLS curve group (`'G1'` or `'G2'`).
 * @returns The BLS point.
 */
export function fromParts<group extends 'G1' | 'G2'>(
  parts: group extends 'G1' ? G1Parts : G2Parts,
  group: group,
): group extends 'G1' ? G1 : G2
// eslint-disable-next-line jsdoc/require-jsdoc
export function fromParts(
  parts: G1Parts | G2Parts,
  _group: 'G1' | 'G2',
): BlsPoint<any> {
  // Today the root `BlsPoint` is already the projective object form. In the
  // future major, this becomes `fromBytes(<bytes encoded from parts>, group)`
  // -- the `group` argument is kept now so call sites match the future shape.
  return { x: parts.x, y: parts.y, z: parts.z }
}

export declare namespace fromParts {
  type ErrorType = Errors.GlobalErrorType
}
