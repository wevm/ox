import { bls12_381 as bls } from '@noble/curves/bls12-381.js'

import type * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Branded, Compute } from './internal/types.js'

/** Type for a field element in the base field of the BLS12-381 curve. */
export type Fp = Hex.Hex
/** Type for a field element in the extension field of the BLS12-381 curve. */
export type Fp2 = Compute<{ c0: Hex.Hex; c1: Hex.Hex }>

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

/** Structured projective parts of a BLS point on the G1 curve. */
export type G1Parts = BlsPoint<Fp>

/** Structured projective parts of a BLS point on the G2 curve. */
export type G2Parts = BlsPoint<Fp2>

const FP_SIZE = 48

/** @internal */
export function fpToBigInt(value: Fp): bigint {
  return BigInt(value)
}

/** @internal */
export function fpFromBigInt(value: bigint): Fp {
  return Hex.fromNumber(value, { size: FP_SIZE })
}

/** @internal */
export function fp2ToBigInt(value: Fp2): { c0: bigint; c1: bigint } {
  return { c0: BigInt(value.c0), c1: BigInt(value.c1) }
}

/** @internal */
export function fp2FromBigInt(value: { c0: bigint; c1: bigint }): Fp2 {
  return {
    c0: Hex.fromNumber(value.c0, { size: FP_SIZE }),
    c1: Hex.fromNumber(value.c1, { size: FP_SIZE }),
  }
}

/**
 * Converts a structured {@link ox#BlsPoint.BlsPoint} into a noble/curves
 * `Point` instance for the appropriate group (G1 or G2).
 *
 * @internal
 */
export function toNoblePoint<group extends 'G1' | 'G2'>(
  point: group extends 'G1' ? G1 : G2,
  group: group,
): unknown {
  if (group === 'G1') {
    const p = point as G1
    return new bls.G1.Point(fpToBigInt(p.x), fpToBigInt(p.y), fpToBigInt(p.z))
  }
  const p = point as G2
  // noble's G2.Point ctor accepts Fp2 instances. Construct via the field
  // helper so we get a real `Fp2` rather than a plain `{c0, c1}`.
  const Fp2 = (bls.fields as any).Fp2
  const x = Fp2.create
    ? Fp2.create(fp2ToBigInt(p.x))
    : Fp2.fromBigTuple([BigInt(p.x.c0), BigInt(p.x.c1)])
  const y = Fp2.create
    ? Fp2.create(fp2ToBigInt(p.y))
    : Fp2.fromBigTuple([BigInt(p.y.c0), BigInt(p.y.c1)])
  const z = Fp2.create
    ? Fp2.create(fp2ToBigInt(p.z))
    : Fp2.fromBigTuple([BigInt(p.z.c0), BigInt(p.z.c1)])
  return new bls.G2.Point(x, y, z)
}

/**
 * Converts a noble/curves `Point` into a structured
 * {@link ox#BlsPoint.BlsPoint}.
 *
 * @internal
 */
export function fromNoblePoint<group extends 'G1' | 'G2'>(
  point: any,
  group: group,
): group extends 'G1' ? G1 : G2 {
  if (group === 'G1') {
    return {
      x: fpFromBigInt(point.X),
      y: fpFromBigInt(point.Y),
      z: fpFromBigInt(point.Z),
    } as never
  }
  // G2: `point.X/Y/Z` are Fp2 instances exposing `.c0` / `.c1` bigints.
  return {
    x: { c0: fpFromBigInt(point.X.c0), c1: fpFromBigInt(point.X.c1) },
    y: { c0: fpFromBigInt(point.Y.c0), c1: fpFromBigInt(point.Y.c1) },
    z: { c0: fpFromBigInt(point.Z.c0), c1: fpFromBigInt(point.Z.c1) },
  } as never
}

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
  const isG1 = typeof point.z === 'string'
  const noblePoint: any = toNoblePoint(point as any, isG1 ? 'G1' : 'G2')
  return noblePoint.toBytes()
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
 * // @log:   x: '0x00...ac',
 * // @log:   y: '0x00...af',
 * // @log:   z: '0x00...01',
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
 * // @log:   x: { c0: '0x00...11', c1: '0x00...22' },
 * // @log:   y: { c0: '0x00...33', c1: '0x00...44' },
 * // @log:   z: { c0: '0x00...01', c1: '0x00...00' },
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
  return fromNoblePoint(point, group) as BlsPoint<any>
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
 * // @log:   x: '0x00...ac',
 * // @log:   y: '0x00...af',
 * // @log:   z: '0x00...01',
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
 * // @log:   x: { c0: '0x00...11', c1: '0x00...22' },
 * // @log:   y: { c0: '0x00...33', c1: '0x00...44' },
 * // @log:   z: { c0: '0x00...01', c1: '0x00...00' },
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
 * @example
 * ### Public Key to Parts
 *
 * ```ts twoslash
 * import { Bls, BlsPoint } from 'ox'
 *
 * const publicKey = Bls.getPublicKey({ privateKey: '0x...' })
 * const parts = BlsPoint.toParts(publicKey)
 * // @log: { x: '0xacaf...', y: '0x09bc...', z: '0x0001' }
 * ```
 *
 * @param point - The BLS point to convert.
 * @returns The structured projective parts.
 */
export function toParts<point extends G1 | G2>(
  point: point,
): point extends G1 ? G1Parts : G2Parts {
  // Today the root `BlsPoint` is already the projective object form -- copy
  // the fields so callers don't accidentally mutate the input.
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
 * @example
 * ### Parts to Public Key
 *
 * ```ts twoslash
 * // @noErrors
 * import { BlsPoint } from 'ox'
 *
 * const publicKey = BlsPoint.fromParts(
 *   { x: '0x00...ac', y: '0x00...af', z: '0x00...01' },
 *   'G1',
 * )
 * // @log: { x: '0x00...ac', y: '0x00...af', z: '0x00...01' }
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
  return { x: parts.x, y: parts.y, z: parts.z }
}

export declare namespace fromParts {
  type ErrorType = Errors.GlobalErrorType
}
