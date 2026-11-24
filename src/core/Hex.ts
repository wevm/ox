import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as internal_bytes from './internal/bytes.js'
import * as internal from './internal/hex.js'
import * as Json from './Json.js'

const decoder = /*#__PURE__*/ new TextDecoder()

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

// Taken from the prototype once, and called on the value, so that an instance
// or subclass defining its own `toHex` can't change the result.
const nativeToHex = (Uint8Array.prototype as { toHex?: () => string }).toHex

/** Root type for a Hex string. */
export type Hex = `0x${string}`

const hexRegex = /^0x[0-9a-fA-F]*$/

/**
 * Asserts if the given value is {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.assert('abc')
 * // @error: InvalidHexValueTypeError:
 * // @error: Value `"abc"` of type `string` is an invalid hex type.
 * // @error: Hex types must be represented as `"0x\${string}"`.
 * ```
 *
 * @param value - The value to assert.
 * @param options - Options.
 */
export function assert(
  value: unknown,
  options: assert.Options = {},
): asserts value is Hex {
  const { even = false, strict = false } = options
  if (!value) throw new InvalidHexTypeError(value)
  if (typeof value !== 'string') throw new InvalidHexTypeError(value)
  if (strict) {
    if (!hexRegex.test(value)) throw new InvalidHexValueError(value)
  }
  if (!value.startsWith('0x')) throw new InvalidHexValueError(value)
  if (even && value.length % 2 !== 0) throw new InvalidLengthError(value as Hex)
}

export declare namespace assert {
  type Options = {
    /**
     * Checks if the {@link ox#Hex.Hex} value has an even number of hexadecimal characters (whole bytes).
     * Keep disabled for RPC quantities (e.g. `0x0`, `0x400`).
     * @default false
     */
    even?: boolean | undefined
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default false */
    strict?: boolean | undefined
  }

  type ErrorType =
    | InvalidHexTypeError
    | InvalidHexValueError
    | InvalidLengthError
    | Errors.GlobalErrorType
}

/**
 * Concatenates two or more {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.concat('0x123', '0x456')
 * // @log: '0x123456'
 * ```
 *
 * @param values - The {@link ox#Hex.Hex} values to concatenate.
 * @returns The concatenated {@link ox#Hex.Hex} value.
 */
export function concat(...values: readonly Hex[]): Hex {
  let hex = '0x'
  for (let i = 0; i < values.length; i++) {
    const value = values[i]!
    // Same result as `value.replace('0x', '')`, without a search when the
    // prefix is present.
    hex += value.startsWith('0x') ? value.slice(2) : value.replace('0x', '')
  }
  return hex as Hex
}

export declare namespace concat {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Instantiates a {@link ox#Hex.Hex} value from a hex string or {@link ox#Bytes.Bytes} value.
 *
 * :::tip
 *
 * To instantiate from a **Boolean**, **String**, or **Number**, use one of the following:
 *
 * - `Hex.fromBoolean`
 *
 * - `Hex.fromString`
 *
 * - `Hex.fromNumber`
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.from('0x48656c6c6f20576f726c6421')
 * // @log: '0x48656c6c6f20576f726c6421'
 *
 * Hex.from(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value to encode.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function from(value: Hex | Bytes.Bytes | readonly number[]): Hex {
  if (value instanceof Uint8Array) return fromBytes(value)
  if (Array.isArray(value)) return fromBytes(new Uint8Array(value))
  return value as never
}

export declare namespace from {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a boolean into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromBoolean(true)
 * // @log: '0x1'
 *
 * Hex.fromBoolean(false)
 * // @log: '0x0'
 *
 * Hex.fromBoolean(true, { size: 32 })
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000001'
 * ```
 *
 * @param value - The boolean value to encode.
 * @param options - Options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromBoolean(
  value: boolean,
  options: fromBoolean.Options = {},
): Hex {
  const hex: Hex = `0x${Number(value)}`
  if (typeof options.size === 'number') {
    internal.assertSize(hex, options.size)
    return padLeft(hex, options.size)
  }
  return hex
}

export declare namespace fromBoolean {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | internal.assertSize.ErrorType
    | padLeft.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} value to encode.
 * @param options - Options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromBytes(
  value: Bytes.Bytes,
  options: fromBytes.Options = {},
): Hex {
  let string = ''
  // Native `Uint8Array.prototype.toHex` is several times faster, and returns a
  // flat string rather than a rope of concatenated pairs.
  // Empty values (including detached or out-of-bounds views, whose length is
  // 0) skip it, since it throws on those.
  if (typeof nativeToHex === 'function' && value instanceof Uint8Array) {
    if (value.length > 0) string = nativeToHex.call(value)
  } else for (let i = 0; i < value.length; i++) string += hexes[value[i]!]
  const hex = `0x${string}` as const

  if (typeof options.size === 'number') {
    internal.assertSize(hex, options.size)
    return padRight(hex, options.size)
  }
  return hex
}

export declare namespace fromBytes {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | internal.assertSize.ErrorType
    | padRight.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Encodes a number or bigint into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromNumber(420)
 * // @log: '0x1a4'
 *
 * Hex.fromNumber(420, { size: 32 })
 * // @log: '0x00000000000000000000000000000000000000000000000000000000000001a4'
 * ```
 *
 * @param value - The number or bigint value to encode.
 * @param options - Options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromNumber(
  value: number | bigint,
  options: fromNumber.Options = {},
): Hex {
  const { signed, size } = options

  // A non-negative `bigint` that fits `size` skips the range check too.
  if (typeof value === 'bigint' && !signed && value >= 0n) {
    const hex = value.toString(16)
    if (!size) return `0x${hex}`
    if (Number.isSafeInteger(size) && size > 0 && hex.length <= size * 2)
      return `0x${hex.padStart(size * 2, '0')}`
  }

  // An unsigned safe integer is in range when there is no `size` or the size
  // exceeds 6 bytes, so it skips the `bigint` range check.
  if (
    typeof value === 'number' &&
    !signed &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    (!size || size > 6)
  ) {
    const hex = value.toString(16)
    if (!size) return `0x${hex}`
    // A safe integer has at most 14 digits, so a whole `size` above 6 fits it.
    if (Number.isSafeInteger(size)) return `0x${hex.padStart(size * 2, '0')}`
    return padLeft(`0x${hex}`, size)
  }

  return fromNumberChecked(value, signed, size)
}

// The range-checked path of `fromNumber`, kept separate so that `fromNumber`
// stays small enough to inline.
function fromNumberChecked(
  value: number | bigint,
  signed: boolean | undefined,
  size: number | undefined,
): Hex {
  const hex =
    `0x${internal.toUnsigned(value, signed, size).toString(16)}` as Hex
  if (size) return padLeft(hex, size) as Hex
  return hex
}

export declare namespace fromNumber {
  type Options =
    | {
        /** Whether or not the number of a signed representation. */
        signed?: boolean | undefined
        /** The size (in bytes) of the output hex value. */
        size: number
      }
    | {
        signed?: undefined
        /** The size (in bytes) of the output hex value. */
        size?: number | undefined
      }

  type ErrorType =
    | IntegerOutOfRangeError
    | padLeft.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Encodes a string into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 *
 * Hex.fromString('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 * ```
 *
 * @param value - The string value to encode.
 * @param options - Options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromString(
  value: string,
  options: fromString.Options = {},
): Hex {
  return fromBytes(internal_bytes.fromString(value), options)
}

export declare namespace fromString {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Checks if two {@link ox#Hex.Hex} values are equal.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.isEqual('0xdeadbeef', '0xdeadbeef')
 * // @log: true
 *
 * Hex.isEqual('0xda', '0xba')
 * // @log: false
 * ```
 *
 * @param hexA - The first {@link ox#Hex.Hex} value.
 * @param hexB - The second {@link ox#Hex.Hex} value.
 * @returns `true` if the two {@link ox#Hex.Hex} values are equal, `false` otherwise.
 */
export function isEqual(hexA: Hex, hexB: Hex) {
  return Bytes.isEqual(Bytes.fromHex(hexA), Bytes.fromHex(hexB))
}

export declare namespace isEqual {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Pads a {@link ox#Hex.Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.padLeft('0x1234', 4)
 * // @log: '0x00001234'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to pad.
 * @param size - The size (in bytes) of the output hex value.
 * @returns The padded {@link ox#Hex.Hex} value.
 */
export function padLeft(
  value: Hex,
  size?: number | undefined,
): padLeft.ReturnType {
  return internal.pad(value, { dir: 'left', size })
}

export declare namespace padLeft {
  type ReturnType = Hex
  type ErrorType = internal.pad.ErrorType | Errors.GlobalErrorType
}

/**
 * Pads a {@link ox#Hex.Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 *
 * Hex.padRight('0x1234', 4)
 * // @log: '0x12340000'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to pad.
 * @param size - The size (in bytes) of the output hex value.
 * @returns The padded {@link ox#Hex.Hex} value.
 */
export function padRight(
  value: Hex,
  size?: number | undefined,
): padRight.ReturnType {
  return internal.pad(value, { dir: 'right', size })
}

export declare namespace padRight {
  type ReturnType = Hex
  type ErrorType = internal.pad.ErrorType | Errors.GlobalErrorType
}

/**
 * Generates a random {@link ox#Hex.Hex} value of the specified length.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const hex = Hex.random(32)
 * // @log: '0x...'
 * ```
 *
 * @returns Random {@link ox#Hex.Hex} value.
 */
export function random(length: number): Hex {
  return fromBytes(Bytes.random(length))
}

export declare namespace random {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Returns a section of a {@link ox#Bytes.Bytes} value given a start/end bytes offset.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.slice('0x0123456789', 1, 4)
 * // @log: '0x234567'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to slice.
 * @param start - The start offset (in bytes).
 * @param end - The end offset (in bytes).
 * @param options - Options.
 * @returns The sliced {@link ox#Hex.Hex} value.
 */
export function slice(
  value: Hex,
  start?: number | undefined,
  end?: number | undefined,
  options: slice.Options = {},
): Hex {
  const { strict } = options
  internal.assertStartOffset(value, start)
  const value_ = `0x${(
    value.startsWith('0x') ? value.slice(2) : value.replace('0x', '')
  ).slice((start ?? 0) * 2, (end ?? value.length) * 2)}` as const
  if (strict) internal.assertEndOffset(value_, start, end)
  return value_
}

export declare namespace slice {
  type Options = {
    /** Asserts that the sliced value is the same size as the given start/end offsets. */
    strict?: boolean | undefined
  }

  type ErrorType =
    | internal.assertStartOffset.ErrorType
    | internal.assertEndOffset.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Retrieves the size of a {@link ox#Hex.Hex} value (in bytes).
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.size('0xdeadbeef')
 * // @log: 4
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to get the size of.
 * @returns The size of the {@link ox#Hex.Hex} value (in bytes).
 */
export function size(value: Hex): number {
  return Math.ceil((value.length - 2) / 2)
}

export declare namespace size {
  export type ErrorType = Errors.GlobalErrorType
}

/**
 * Trims leading zeros from a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.trimLeft('0x00000000deadbeef')
 * // @log: '0xdeadbeef'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to trim.
 * @returns The trimmed {@link ox#Hex.Hex} value.
 */
export function trimLeft(value: Hex): trimLeft.ReturnType {
  return internal.trim(value, { dir: 'left' })
}

export declare namespace trimLeft {
  type ReturnType = Hex

  type ErrorType = internal.trim.ErrorType | Errors.GlobalErrorType
}

/**
 * Trims trailing zeros from a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.trimRight('0xdeadbeef00000000')
 * // @log: '0xdeadbeef'
 * ```
 *
 * @param value - The {@link ox#Hex.Hex} value to trim.
 * @returns The trimmed {@link ox#Hex.Hex} value.
 */
export function trimRight(value: Hex): trimRight.ReturnType {
  return internal.trim(value, { dir: 'right' })
}

export declare namespace trimRight {
  type ReturnType = Hex

  type ErrorType = internal.trim.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a {@link ox#Hex.Hex} value into a BigInt.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBigInt('0x1a4')
 * // @log: 420n
 *
 * Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // @log: 420n
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options - Options.
 * @returns The decoded BigInt.
 */
export function toBigInt(hex: Hex, options: toBigInt.Options = {}): bigint {
  const { signed } = options

  if (options.size) internal.assertSize(hex, options.size)

  // Empty hex reads as zero, as an empty byte string does in RLP.
  const value = hex === '0x' ? 0n : BigInt(hex)
  if (!signed) return value
  return BigInt.asIntN(size(hex) * 8, value)
}

export declare namespace toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = internal.assertSize.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a {@link ox#Hex.Hex} value into a boolean.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBoolean('0x01')
 * // @log: true
 *
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // @log: true
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options - Options.
 * @returns The decoded boolean.
 */
export function toBoolean(hex: Hex, options: toBoolean.Options = {}): boolean {
  if (options.size) internal.assertSize(hex, options.size)
  const hex_ = trimLeft(hex)
  if (hex_ === '0x') return false
  if (hex_ === '0x1') return true
  throw new InvalidHexBooleanError(hex)
}

export declare namespace toBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | internal.assertSize.ErrorType
    | trimLeft.ErrorType
    | InvalidHexBooleanError
    | Errors.GlobalErrorType
}

/**
 * Decodes a {@link ox#Hex.Hex} value into a {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const data = Hex.toBytes('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options - Options.
 * @returns The decoded {@link ox#Bytes.Bytes}.
 */
export function toBytes(hex: Hex, options: toBytes.Options = {}): Bytes.Bytes {
  return Bytes.fromHex(hex, options)
}

export declare namespace toBytes {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Decodes a {@link ox#Hex.Hex} value into a number.
 *
 * Throws `Hex.IntegerOutOfRangeError` when the value is not a safe integer. Use `toBigInt` for larger values.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toNumber('0x1a4')
 * // @log: 420
 *
 * Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // @log: 420
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options - Options.
 * @returns The decoded number.
 */
export function toNumber(hex: Hex, options: toNumber.Options = {}): number {
  const { signed, size } = options
  const value =
    !signed && !size && hex !== '0x'
      ? Number(hex)
      : Number(toBigInt(hex, options))
  if (!Number.isSafeInteger(value))
    throw new IntegerOutOfRangeError({
      max: `${Number.MAX_SAFE_INTEGER}`,
      min: signed ? `${Number.MIN_SAFE_INTEGER}` : '0',
      signed,
      size,
      value: `${value}`,
    })
  return value
}

export declare namespace toNumber {
  type Options = toBigInt.Options

  type ErrorType =
    | toBigInt.ErrorType
    | IntegerOutOfRangeError
    | Errors.GlobalErrorType
}

/**
 * Decodes a {@link ox#Hex.Hex} value into a string.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toString('0x48656c6c6f20576f726c6421')
 * // @log: 'Hello world!'
 *
 * Hex.toString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // @log: 'Hello world'
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options - Options.
 * @returns The decoded string.
 */
export function toString(hex: Hex, options: toString.Options = {}): string {
  const { size } = options

  let bytes = Bytes.fromHex(hex)
  if (size) {
    internal_bytes.assertSize(bytes, size)
    bytes = Bytes.trimRight(bytes)
  }
  return decoder.decode(bytes)
}

export declare namespace toString {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | internal_bytes.assertSize.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.trimRight.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Checks if the given value is {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.validate('0xdeadbeef')
 * // @log: true
 *
 * Hex.validate(Bytes.from([1, 2, 3]))
 * // @log: false
 * ```
 *
 * @param value - The value to check.
 * @param options - Options.
 * @returns `true` if the value is a {@link ox#Hex.Hex}, `false` otherwise.
 */
export function validate(
  value: unknown,
  options: validate.Options = {},
): value is Hex {
  const { even = false, strict = false } = options
  // Mirrors `assert` without constructing and catching an error.
  if (!value || typeof value !== 'string') return false
  if (strict && !hexRegex.test(value)) return false
  if (!value.startsWith('0x')) return false
  if (even && value.length % 2 !== 0) return false
  return true
}

export declare namespace validate {
  type Options = {
    /**
     * Checks if the {@link ox#Hex.Hex} value has an even number of hexadecimal characters (whole bytes).
     * Keep disabled for RPC quantities (e.g. `0x0`, `0x400`).
     * @default false
     */
    even?: boolean | undefined
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default false */
    strict?: boolean | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Thrown when the provided integer is out of range, and cannot be represented as a hex value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromNumber(420182738912731283712937129)
 * // @error: Hex.IntegerOutOfRangeError: Number \`4.2018273891273126e+26\` is not in safe unsigned integer range (`0` to `9007199254740991`)
 * ```
 */
export class IntegerOutOfRangeError extends Errors.BaseError {
  override readonly name = 'Hex.IntegerOutOfRangeError'

  constructor({
    max,
    min,
    signed,
    size,
    value,
  }: {
    max?: string | undefined
    min: string
    signed?: boolean | undefined
    size?: number | undefined
    value: string
  }) {
    super(
      `Number \`${value}\` is not in safe${
        size ? ` ${size * 8}-bit` : ''
      }${signed ? ' signed' : ' unsigned'} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`,
    )
  }
}

/**
 * Thrown when the provided hex value cannot be represented as a boolean.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBoolean('0xa')
 * // @error: Hex.InvalidHexBooleanError: Hex value `"0xa"` is not a valid boolean.
 * // @error: The hex value must be `"0x0"` (false) or `"0x1"` (true).
 * ```
 */
export class InvalidHexBooleanError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidHexBooleanError'

  constructor(hex: Hex) {
    super(`Hex value \`"${hex}"\` is not a valid boolean.`, {
      metaMessages: [
        'The hex value must be `"0x0"` (false) or `"0x1"` (true).',
      ],
    })
  }
}

/**
 * Thrown when the provided value is not a valid hex type.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.assert(1)
 * // @error: Hex.InvalidHexTypeError: Value `1` of type `number` is an invalid hex type.
 * ```
 */
export class InvalidHexTypeError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidHexTypeError'

  constructor(value: unknown) {
    super(
      `Value \`${typeof value === 'object' ? Json.stringify(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`,
      {
        metaMessages: ['Hex types must be represented as `"0x${string}"`.'],
      },
    )
  }
}

/**
 * Thrown when the provided hex value is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.assert('0x0123456789abcdefg')
 * // @error: Hex.InvalidHexValueError: Value `0x0123456789abcdefg` is an invalid hex value.
 * // @error: Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).
 * ```
 */
export class InvalidHexValueError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidHexValueError'

  constructor(value: unknown) {
    super(`Value \`${value}\` is an invalid hex value.`, {
      metaMessages: [
        'Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).',
      ],
    })
  }
}

/**
 * Thrown when the provided hex value is an odd length.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.fromHex('0xabcde')
 * // @error: Hex.InvalidLengthError: Hex value `"0xabcde"` is an odd length (5 nibbles).
 * ```
 */
export class InvalidLengthError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidLengthError'

  constructor(value: Hex) {
    super(
      `Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`,
      {
        metaMessages: ['It must be an even length.'],
      },
    )
  }
}

/**
 * Thrown when the size of the value exceeds the expected max size.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromString('Hello World!', { size: 8 })
 * // @error: Hex.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.
 * ```
 */
export class SizeOverflowError extends Errors.BaseError {
  override readonly name = 'Hex.SizeOverflowError'

  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
    )
  }
}

/**
 * Thrown when the slice offset exceeds the bounds of the value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.slice('0x0123456789', 6)
 * // @error: Hex.SliceOffsetOutOfBoundsError: Slice starting at offset `6` is out-of-bounds (size: `5`).
 * ```
 */
export class SliceOffsetOutOfBoundsError extends Errors.BaseError {
  override readonly name = 'Hex.SliceOffsetOutOfBoundsError'

  constructor({
    offset,
    position,
    size,
  }: { offset: number; position: 'start' | 'end'; size: number }) {
    super(
      `Slice ${
        position === 'start' ? 'starting' : 'ending'
      } at offset \`${offset}\` is out-of-bounds (size: \`${size}\`).`,
    )
  }
}

/**
 * Thrown when the size of the value exceeds the pad size.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.padLeft('0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9', 32)
 * // @error: Hex.SizeExceedsPaddingSizeError: Hex size (`43`) exceeds padding size (`32`).
 * ```
 */
export class SizeExceedsPaddingSizeError extends Errors.BaseError {
  override readonly name = 'Hex.SizeExceedsPaddingSizeError'

  constructor({
    size,
    targetSize,
    type,
  }: {
    size: number
    targetSize: number
    type: 'Hex' | 'Bytes'
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} size (\`${size}\`) exceeds padding size (\`${targetSize}\`).`,
    )
  }
}
