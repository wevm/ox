import { secp256k1 } from '@noble/curves/secp256k1.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute, ExactPartial } from './internal/types.js'
import * as Json from './Json.js'
import * as Solidity from './Solidity.js'

/**
 * Canonical type for an ECDSA signature.
 *
 * A {@link ox#Signature.Signature} is a serialized {@link ox#Hex.Hex} string:
 *
 * - Recovered (default): `0x{r32}{s32}{v1}` -- 65 bytes (`v` is `0x1b` or
 *   `0x1c`).
 * - Non-recovered: `0x{r32}{s32}` -- 64 bytes.
 *
 * Use {@link ox#Signature.toParts} / {@link ox#Signature.fromParts} to convert
 * between the canonical form and the structured {@link ox#Signature.Parts}.
 */
export type Signature<recovered extends boolean = true> = recovered extends true
  ? Hex.Hex
  : Hex.Hex

/** Structured parts of an ECDSA signature. */
export type Parts<recovered extends boolean = true> = Compute<
  recovered extends true
    ? {
        r: bigint
        s: bigint
        yParity: number
      }
    : {
        r: bigint
        s: bigint
        yParity?: number | undefined
      }
>

/** RPC-formatted ECDSA signature. */
export type Rpc<recovered extends boolean = true> = Compute<
  recovered extends true
    ? {
        r: Hex.Hex
        s: Hex.Hex
        yParity: Hex.Hex
      }
    : {
        r: Hex.Hex
        s: Hex.Hex
        yParity?: Hex.Hex | undefined
      }
>

/** (Legacy) ECDSA signature. */
export type Legacy<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  v: numberType
}

/** RPC-formatted (Legacy) ECDSA signature. */
export type LegacyRpc = Legacy<Hex.Hex, Hex.Hex>

export type Tuple = readonly [yParity: Hex.Hex, r: Hex.Hex, s: Hex.Hex]

/**
 * Asserts that a {@link ox#Signature.Parts} object is a valid ECDSA signature.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.assert({
 *   r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @error: InvalidSignatureRError:
 * // @error: Value `-549...n` is an invalid r value.
 * // @error: r must be a positive integer less than 2^256.
 * ```
 *
 * @param parts - The signature parts to assert.
 */
export function assert(
  parts: ExactPartial<Parts>,
  options: assert.Options = {},
): asserts parts is Parts {
  const { recovered } = options
  if (typeof parts.r === 'undefined')
    throw new MissingPropertiesError({ signature: parts })
  if (typeof parts.s === 'undefined')
    throw new MissingPropertiesError({ signature: parts })
  if (recovered && typeof parts.yParity === 'undefined')
    throw new MissingPropertiesError({ signature: parts })
  if (parts.r < 0n || parts.r > Solidity.maxUint256)
    throw new InvalidRError({ value: parts.r })
  if (parts.s < 0n || parts.s > Solidity.maxUint256)
    throw new InvalidSError({ value: parts.s })
  if (
    typeof parts.yParity === 'number' &&
    parts.yParity !== 0 &&
    parts.yParity !== 1
  )
    throw new InvalidYParityError({ value: parts.yParity })
}

export declare namespace assert {
  type Options = {
    /** Whether or not the signature should be recovered (contain `yParity`). */
    recovered?: boolean
  }

  type ErrorType =
    | MissingPropertiesError
    | InvalidRError
    | InvalidSError
    | InvalidYParityError
    | Errors.GlobalErrorType
}

/**
 * Deserializes a {@link ox#Bytes.Bytes} signature into a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Signature } from 'ox'
 *
 * Signature.fromBytes(new Uint8Array([128, 3, 131, ...]))
 * // @log: '0x6e100a352ec6ad1b...'
 * ```
 *
 * @param signature - The serialized signature.
 * @returns The {@link ox#Signature.Signature}.
 */
export function fromBytes(signature: Bytes.Bytes): Signature {
  return fromHex(Hex.fromBytes(signature))
}

export declare namespace fromBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Normalizes a {@link ox#Hex.Hex} signature to a canonical
 * {@link ox#Signature.Signature}.
 *
 * Accepts either a 64-byte compact signature or a 65-byte recovered signature.
 * Normalizes a trailing `v` value of `0x00` / `0x01` to `0x1b` / `0x1c` so the
 * canonical recovered form is always `r ++ s ++ v`.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.fromHex('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c')
 * // @log: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c'
 * ```
 *
 * @param signature - The serialized signature.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromHex(signature: Hex.Hex): Signature {
  if (signature.length !== 130 && signature.length !== 132)
    throw new InvalidSerializedSizeError({ signature })

  if (signature.length === 130) return signature

  const v = Number(`0x${signature.slice(130)}`)
  if (Number.isNaN(v)) throw new InvalidYParityError({ value: v })
  // Normalize 0/1 -> 27/28 so the canonical recovered hex always ends in 1b/1c.
  if (v === 0 || v === 27) return `${signature.slice(0, 130)}1b` as Hex.Hex
  if (v === 1 || v === 28) return `${signature.slice(0, 130)}1c` as Hex.Hex
  if (v >= 35) {
    const yParity = v % 2 === 0 ? 1 : 0
    return `${signature.slice(0, 130)}${yParity === 0 ? '1b' : '1c'}` as Hex.Hex
  }
  throw new InvalidYParityError({ value: v })
}

export declare namespace fromHex {
  type ErrorType =
    | InvalidSerializedSizeError
    | InvalidYParityError
    | Errors.GlobalErrorType
}

/**
 * Extracts an ECDSA {@link ox#Signature.Signature} from an arbitrary object
 * that may include signature properties (`r`, `s`, `yParity`, or `v`).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Signature } from 'ox'
 *
 * Signature.extract({
 *   baz: 'barry',
 *   foo: 'bar',
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 *   zebra: 'stripes',
 * })
 * // @log: '0x6e100a352ec6ad1b...'
 * ```
 *
 * @param value - The arbitrary object to extract the signature from.
 * @returns The extracted {@link ox#Signature.Signature}.
 */
export function extract(value: extract.Value): Signature | undefined {
  if (typeof value.r === 'undefined') return undefined
  if (typeof value.s === 'undefined') return undefined
  const r = typeof value.r === 'string' ? BigInt(value.r) : value.r
  const s = typeof value.s === 'string' ? BigInt(value.s) : value.s
  const yParity = (() => {
    if (typeof value.yParity === 'number') return value.yParity
    if (typeof value.yParity === 'string') {
      const n = Number(value.yParity)
      return vToYParity(n)
    }
    if (typeof value.v === 'number') return vToYParity(value.v)
    if (typeof value.v === 'string') return vToYParity(Number(value.v))
    return undefined
  })()
  return fromParts(
    yParity === undefined ? ({ r, s } as never) : ({ r, s, yParity } as never),
  )
}

export declare namespace extract {
  type Value = {
    r?: bigint | Hex.Hex | undefined
    s?: bigint | Hex.Hex | undefined
    yParity?: number | Hex.Hex | undefined
    v?: number | Hex.Hex | undefined
  }
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a DER-encoded signature to a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromDerBytes(new Uint8Array([132, 51, 23, ...]))
 * // @log: '0x6e100a352ec6ad1b...'
 * ```
 *
 * @param signature - The DER-encoded signature to convert.
 * @returns The non-recovered {@link ox#Signature.Signature}.
 */
export function fromDerBytes(signature: Bytes.Bytes): Signature<false> {
  return fromDerHex(Hex.fromBytes(signature))
}

export declare namespace fromDerBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a DER-encoded signature to a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromDerHex('0x304402206e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf02204a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8')
 * // @log: '0x6e100a352ec6ad1b...'
 * ```
 *
 * @param signature - The DER-encoded signature to convert.
 * @returns The non-recovered {@link ox#Signature.Signature}.
 */
export function fromDerHex(signature: Hex.Hex): Signature<false> {
  const { r, s } = secp256k1.Signature.fromHex(
    Hex.from(signature).slice(2),
    'der',
  )
  return fromParts({ r, s } as never) as Signature<false>
}

export declare namespace fromDerHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Legacy} into a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromLegacy({ r: 1n, s: 2n, v: 28 })
 * // @log: '0x000...01000...021c'
 * ```
 *
 * @param signature - The {@link ox#Signature.Legacy} to convert.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromLegacy(signature: Legacy): Signature {
  return fromParts({
    r: signature.r,
    s: signature.s,
    yParity: vToYParity(signature.v),
  })
}

export declare namespace fromLegacy {
  type ErrorType = vToYParity.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Rpc} into a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromRpc({
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 * })
 * ```
 *
 * @param signature - The {@link ox#Signature.Rpc} to convert.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromRpc(signature: {
  r: Hex.Hex
  s: Hex.Hex
  yParity?: Hex.Hex | undefined
  v?: Hex.Hex | undefined
}): Signature {
  const yParity = (() => {
    const v = signature.v ? Number(signature.v) : undefined
    let yParity = signature.yParity ? Number(signature.yParity) : undefined
    if (typeof v === 'number' && typeof yParity !== 'number')
      yParity = vToYParity(v)
    if (typeof yParity !== 'number')
      throw new InvalidYParityError({ value: signature.yParity })
    return yParity
  })()

  return fromParts({
    r: BigInt(signature.r),
    s: BigInt(signature.s),
    yParity,
  })
}

export declare namespace fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Tuple} to a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromTuple(['0x01', '0x7b', '0x1c8'])
 * // @log: '0x000...07b000...1c81c'
 * ```
 *
 * @param tuple - The {@link ox#Signature.Tuple} to convert.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromTuple(tuple: Tuple): Signature {
  const [yParity, r, s] = tuple
  const parts: Parts = {
    r: r === '0x' ? 0n : BigInt(r),
    s: s === '0x' ? 0n : BigInt(s),
    yParity: yParity === '0x' ? 0 : Number(yParity),
  }
  assert(parts)
  return fromParts(parts)
}

export declare namespace fromTuple {
  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#Signature.Signature} to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * })
 *
 * const bytes = Signature.toBytes(signature)
 * // @log: Uint8Array [102, 16, 10, ...]
 * ```
 *
 * @param signature - The signature to serialize.
 * @returns The serialized signature.
 */
export function toBytes(signature: Signature<boolean>): Bytes.Bytes {
  return Bytes.fromHex(signature)
}

export declare namespace toBytes {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Signature.Signature} as a 64-byte compact byte
 * representation (`r ++ s`, big-endian, 32 bytes each).
 *
 * Used for signature inputs that omit the recovery byte (e.g. ECDSA verify).
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 *
 * const bytes = Signature.toCompactBytes(signature)
 * // @log: Uint8Array [110, 16, 10, ...] // 64 bytes
 * ```
 *
 * @param signature - The signature to encode.
 * @returns The 64-byte compact representation.
 */
export function toCompactBytes(signature: Signature<boolean>): Bytes.Bytes {
  return Bytes.fromHex(signature.slice(0, 130) as Hex.Hex)
}

export declare namespace toCompactBytes {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a 64-byte compact byte representation (`r ++ s`, big-endian) into a
 * canonical {@link ox#Signature.Signature} (without recovery).
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromCompactBytes(new Uint8Array(64))
 * // @log: '0x000...00000...00'
 * ```
 *
 * @param bytes - The 64-byte compact representation.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromCompactBytes(bytes: Bytes.Bytes): Signature<false> {
  return Hex.fromBytes(bytes) as Signature<false>
}

export declare namespace fromCompactBytes {
  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Signature.Signature} as a 65-byte recovered byte
 * representation (`r ++ s ++ yParity`, big-endian).
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 *
 * const bytes = Signature.toRecoveredBytes(signature)
 * // @log: Uint8Array [110, 16, 10, ..., 1] // 65 bytes
 * ```
 *
 * @param signature - The signature to encode.
 * @returns The 65-byte recovered representation.
 */
export function toRecoveredBytes(signature: Signature): Bytes.Bytes {
  const bytes = new Uint8Array(65)
  bytes.set(Bytes.fromHex(signature.slice(0, 130) as Hex.Hex), 0)
  // Convert trailing `v` (0x1b/0x1c) back to yParity (0/1).
  const v = Number(`0x${signature.slice(130)}`)
  bytes[64] = vToYParity(v)
  return bytes
}

export declare namespace toRecoveredBytes {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a 65-byte recovered byte representation (`r ++ s ++ yParity`,
 * big-endian) into a canonical {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromRecoveredBytes(new Uint8Array(65))
 * // @log: '0x000...01b'
 * ```
 *
 * @param bytes - The 65-byte recovered representation.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromRecoveredBytes(bytes: Bytes.Bytes): Signature {
  const compact = Hex.fromBytes(bytes.subarray(0, 64))
  const yParity = bytes[64]!
  const v = yParity === 0 ? '1b' : '1c'
  return `${compact}${v}` as Signature
}

export declare namespace fromRecoveredBytes {
  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} to its structured
 * {@link ox#Signature.Parts} form.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const parts = Signature.toParts(
 *   '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c',
 * )
 * // @log: { r: 49782...n, s: 33726...n, yParity: 1 }
 * ```
 *
 * @param signature - The signature to convert.
 * @returns The structured {@link ox#Signature.Parts}.
 */
export function toParts<recovered extends boolean = true>(
  signature: Signature<recovered>,
): Parts<recovered> {
  if (signature.length !== 130 && signature.length !== 132)
    throw new InvalidSerializedSizeError({ signature })
  const r = BigInt(Hex.slice(signature, 0, 32))
  const s = BigInt(Hex.slice(signature, 32, 64))
  if (signature.length === 130) return { r, s } as never
  const v = Number(`0x${signature.slice(130)}`)
  const yParity = vToYParity(v)
  return { r, s, yParity } as never
}

export declare namespace toParts {
  type ErrorType = vToYParity.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts {@link ox#Signature.Parts} into a canonical
 * {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @log: '0x6e100a352ec6ad1b...1c'
 * ```
 *
 * @param parts - The structured parts to convert.
 * @returns The canonical {@link ox#Signature.Signature}.
 */
export function fromParts<recovered extends boolean = true>(
  parts: Parts<recovered>,
): Signature<recovered> {
  assert(parts)
  const r = parts.r
  const s = parts.s
  const recovery =
    typeof parts.yParity === 'number'
      ? Hex.fromNumber(yParityToV(parts.yParity), { size: 1 })
      : '0x'
  return Hex.concat(
    Hex.fromNumber(r, { size: 32 }),
    Hex.fromNumber(s, { size: 32 }),
    recovery,
  ) as Signature<recovered>
}

export declare namespace fromParts {
  type ErrorType =
    | assert.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Identity helper: returns the {@link ox#Signature.Signature} as
 * {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * })
 *
 * Signature.toHex(signature)
 * // @log: '0x6e100a352ec6ad1b...1c'
 * ```
 *
 * @param signature - The signature.
 * @returns The {@link ox#Hex.Hex} representation.
 */
export function toHex(signature: Signature<boolean>): Hex.Hex {
  return signature
}

export declare namespace toHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} to DER-encoded format.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * })
 *
 * const signature_der = Signature.toDerBytes(signature)
 * // @log: Uint8Array [132, 51, 23, ...]
 * ```
 *
 * @param signature - The signature to convert.
 * @returns The DER-encoded signature.
 */
export function toDerBytes(signature: Signature<boolean>): Bytes.Bytes {
  const { r, s } = toParts(signature)
  const sig = new secp256k1.Signature(r, s)
  return sig.toBytes('der')
}

export declare namespace toDerBytes {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} to DER-encoded format.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * })
 *
 * const signature_der = Signature.toDerHex(signature)
 * // @log: '0x304402206e100a352ec6ad1b...'
 * ```
 *
 * @param signature - The signature to convert.
 * @returns The DER-encoded signature.
 */
export function toDerHex(signature: Signature<boolean>): Hex.Hex {
  const { r, s } = toParts(signature)
  const sig = new secp256k1.Signature(r, s)
  return `0x${sig.toHex('der')}`
}

export declare namespace toDerHex {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} into a {@link ox#Signature.Legacy}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromParts({ r: 1n, s: 2n, yParity: 1 })
 * const legacy = Signature.toLegacy(signature)
 * // @log: { r: 1n, s: 2n, v: 28 }
 * ```
 *
 * @param signature - The {@link ox#Signature.Signature} to convert.
 * @returns The converted {@link ox#Signature.Legacy}.
 */
export function toLegacy(signature: Signature): Legacy {
  const { r, s, yParity } = toParts(signature)
  return {
    r,
    s,
    v: yParityToV(yParity),
  }
}

export declare namespace toLegacy {
  type ErrorType = yParityToV.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} into a {@link ox#Signature.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.toRpc(Signature.fromParts({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * }))
 * ```
 *
 * @param signature - The {@link ox#Signature.Signature} to convert.
 * @returns The converted {@link ox#Signature.Rpc}.
 */
export function toRpc(signature: Signature): Rpc {
  const { r, s, yParity } = toParts(signature)
  return {
    r: Hex.fromNumber(r, { size: 32 }),
    s: Hex.fromNumber(s, { size: 32 }),
    yParity: yParity === 0 ? '0x0' : '0x1',
  }
}

export declare namespace toRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Signature.Signature} to a serialized
 * {@link ox#Signature.Tuple} for use in Transaction Envelopes, EIP-7702
 * Authorization Lists, etc.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signatureTuple = Signature.toTuple(Signature.fromParts({
 *   r: 123n,
 *   s: 456n,
 *   yParity: 1,
 * }))
 * // @log: [yParity: '0x01', r: '0x7b', s: '0x1c8']
 * ```
 *
 * @param signature - The {@link ox#Signature.Signature} to convert.
 * @returns The {@link ox#Signature.Tuple}.
 */
export function toTuple(signature: Signature): Tuple {
  const { r, s, yParity } = toParts(signature)
  return [
    yParity ? '0x01' : '0x',
    r === 0n ? '0x' : (`0x${r.toString(16)}` as Hex.Hex),
    s === 0n ? '0x' : (`0x${s.toString(16)}` as Hex.Hex),
  ] as const
}

export declare namespace toTuple {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Validates a {@link ox#Signature.Parts} object. Returns `true` if valid,
 * `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const valid = Signature.validate({
 *   r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @log: false
 * ```
 *
 * @param parts - The signature parts to validate.
 */
export function validate(
  parts: ExactPartial<Parts>,
  options: validate.Options = {},
): boolean {
  try {
    assert(parts, options)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type Options = {
    /** Whether or not the signature should be recovered (contain `yParity`). */
    recovered?: boolean
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a ECDSA `v` value to a `yParity` value.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const yParity = Signature.vToYParity(28)
 * // @log: 1
 * ```
 *
 * @param v - The ECDSA `v` value to convert.
 * @returns The `yParity` value.
 */
export function vToYParity(v: number): 0 | 1 {
  if (v === 0 || v === 27) return 0
  if (v === 1 || v === 28) return 1
  if (v >= 35) return v % 2 === 0 ? 1 : 0
  throw new InvalidVError({ value: v })
}

export declare namespace vToYParity {
  type ErrorType = InvalidVError | Errors.GlobalErrorType
}

/**
 * Converts a ECDSA `yParity` value to a `v` value.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const v = Signature.yParityToV(1)
 * // @log: 28
 * ```
 *
 * @param yParity - The ECDSA `yParity` value to convert.
 * @returns The `v` value.
 */
export function yParityToV(yParity: number): number {
  if (yParity === 0) return 27
  if (yParity === 1) return 28
  throw new InvalidYParityError({ value: yParity })
}

export declare namespace yParityToV {
  type ErrorType = InvalidVError | Errors.GlobalErrorType
}

/** Thrown when the serialized signature is of an invalid size. */
export class InvalidSerializedSizeError extends Errors.BaseError {
  override readonly name = 'Signature.InvalidSerializedSizeError'

  constructor({ signature }: { signature: Hex.Hex | Bytes.Bytes }) {
    super(`Value \`${signature}\` is an invalid signature size.`, {
      metaMessages: [
        'Expected: 64 bytes or 65 bytes.',
        `Received ${Hex.size(Hex.from(signature))} bytes.`,
      ],
    })
  }
}

/** Thrown when the signature is missing either an `r`, `s`, or `yParity` property. */
export class MissingPropertiesError extends Errors.BaseError {
  override readonly name = 'Signature.MissingPropertiesError'

  constructor({ signature }: { signature: unknown }) {
    super(
      `Signature \`${Json.stringify(signature)}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.`,
    )
  }
}

/** Thrown when the signature has an invalid `r` value. */
export class InvalidRError extends Errors.BaseError {
  override readonly name = 'Signature.InvalidRError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid r value. r must be a positive integer less than 2^256.`,
    )
  }
}

/** Thrown when the signature has an invalid `s` value. */
export class InvalidSError extends Errors.BaseError {
  override readonly name = 'Signature.InvalidSError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid s value. s must be a positive integer less than 2^256.`,
    )
  }
}

/** Thrown when the signature has an invalid `yParity` value. */
export class InvalidYParityError extends Errors.BaseError {
  override readonly name = 'Signature.InvalidYParityError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid y-parity value. Y-parity must be 0 or 1.`,
    )
  }
}

/** Thrown when the signature has an invalid `v` value. */
export class InvalidVError extends Errors.BaseError {
  override readonly name = 'Signature.InvalidVError'

  constructor({ value }: { value: number }) {
    super(`Value \`${value}\` is an invalid v value. v must be 27, 28 or >=35.`)
  }
}
