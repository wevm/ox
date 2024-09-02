import { InvalidBytesBooleanError, InvalidTypeError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/from.js'
import { Hex_toBigInt, Hex_toNumber } from '../Hex/to.js'
import type { Hex } from '../Hex/types.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_trimLeft, Bytes_trimRight } from './trim.js'
import type { Bytes } from './types.js'

/**
 * Decodes {@link Bytes#Bytes} into a UTF-8 string, {@link Hex#Hex}, number, bigint or boolean.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.to(
 *   Bytes.from([1, 164]),
 *   'number'
 * )
 * // @log: 420
 * ```
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 *
 * Bytes.to(
 *   Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
 *   'string'
 * )
 * // @log: 'Hello world'
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} to decode.
 * @param to - Type to decode the {@link Bytes#Bytes} into.
 * @param options - Decoding options.
 * @returns Decoded value.
 */
export function Bytes_to<
  to extends 'string' | 'Hex' | 'bigint' | 'number' | 'boolean',
>(
  bytes: Bytes,
  to: to | 'string' | 'Hex' | 'bigint' | 'number' | 'boolean',
  options: Bytes_to.Options = {},
): Bytes_to.ReturnType<to> {
  if (to === 'number') return Bytes_toNumber(bytes, options) as never
  if (to === 'bigint') return Bytes_toBigInt(bytes, options) as never
  if (to === 'boolean') return Bytes_toBoolean(bytes, options) as never
  if (to === 'string') return Bytes_toString(bytes, options) as never
  if (to === 'Hex') return Bytes_toHex(bytes, options) as never
  throw new InvalidTypeError(to, 'string | Hex | bigint | number | boolean')
}

export declare namespace Bytes_to {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ReturnType<
    to extends 'string' | 'Hex' | 'bigint' | 'number' | 'boolean',
  > =
    | (to extends 'string' ? string : never)
    | (to extends 'Hex' ? Hex : never)
    | (to extends 'bigint' ? bigint : never)
    | (to extends 'number' ? number : never)
    | (to extends 'boolean' ? boolean : never)

  type ErrorType =
    | Bytes_toBigInt.ErrorType
    | Bytes_toBoolean.ErrorType
    | Bytes_toNumber.ErrorType
    | Bytes_toString.ErrorType
    | Hex_fromBytes.ErrorType
    | InvalidTypeError
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_to.parseError = (error: unknown) => error as Bytes_to.ErrorType

/**
 * Decodes a {@link Bytes#Bytes} into a bigint.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 *
 * Bytes.toBigInt(Bytes.from([1, 164]))
 * // @log: 420n
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} to decode.
 * @param options - Decoding options.
 * @returns Decoded bigint.
 */
export function Bytes_toBigInt(
  bytes: Bytes,
  options: Bytes_toBigInt.Options = {},
): bigint {
  const { size } = options
  if (typeof size !== 'undefined') Bytes_assertSize(bytes, size)
  const hex = Hex_fromBytes(bytes, options)
  return Hex_toBigInt(hex, options)
}

export declare namespace Bytes_toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_fromBytes.ErrorType
    | Hex_toBigInt.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_toBigInt.parseError = (error: unknown) =>
  error as Bytes_toBigInt.ErrorType

/**
 * Decodes a {@link Bytes#Bytes} into a boolean.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 *
 * Bytes.toBoolean(Bytes.from([1]))
 * // @log: true
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} to decode.
 * @param options - Decoding options.
 * @returns Decoded boolean.
 */
export function Bytes_toBoolean(
  bytes_: Bytes,
  options: Bytes_toBoolean.Options = {},
): boolean {
  const { size } = options
  let bytes = bytes_
  if (typeof size !== 'undefined') {
    Bytes_assertSize(bytes, size)
    bytes = Bytes_trimLeft(bytes)
  }
  if (bytes.length > 1 || bytes[0]! > 1)
    throw new InvalidBytesBooleanError(bytes)
  return Boolean(bytes[0])
}

export declare namespace Bytes_toBoolean {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_trimLeft.ErrorType
    | GlobalErrorType
}

Bytes_toBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toBoolean.ErrorType

/**
 * Encodes a {@link Bytes#Bytes} value into a {@link Hex#Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toHex(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} to decode.
 * @param options -
 * @returns Decoded {@link Hex#Hex} value.
 */
export function Bytes_toHex(
  value: Bytes,
  options: Bytes_toHex.Options = {},
): Hex {
  return Hex_fromBytes(value, options)
}

export declare namespace Bytes_toHex {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType = Hex_fromBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bytes_toHex.parseError = (error: unknown) => error as Bytes_toHex.ErrorType

/**
 * Decodes a {@link Bytes#Bytes} into a number.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toNumber(Bytes.from([1, 164]))
 * // @log: 420
 * ```
 */
export function Bytes_toNumber(
  bytes: Bytes,
  options: Bytes_toNumber.Options = {},
): number {
  const { size } = options
  if (typeof size !== 'undefined') Bytes_assertSize(bytes, size)
  const hex = Hex_fromBytes(bytes, options)
  return Hex_toNumber(hex, options)
}

export declare namespace Bytes_toNumber {
  export type Options = Bytes_toBigInt.Options

  export type ErrorType =
    | Hex_fromBytes.ErrorType
    | Hex_toNumber.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_toNumber.parseError = (error: unknown) =>
  error as Bytes_toNumber.ErrorType

const decoder = /*#__PURE__*/ new TextDecoder()

/**
 * Decodes a {@link Bytes#Bytes} into a UTF-8 string.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.toString(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: 'Hello world'
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} to decode.
 * @param options -
 * @returns Decoded string.
 */
export function Bytes_toString(
  bytes: Bytes,
  options: Bytes_toString.Options = {},
): string {
  const { size } = options

  let bytes_ = bytes
  if (typeof size !== 'undefined') {
    Bytes_assertSize(bytes_, size)
    bytes_ = Bytes_trimRight(bytes_)
  }
  return decoder.decode(bytes_)
}

export declare namespace Bytes_toString {
  export type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  export type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_trimRight.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Bytes_toString.parseError = (error: unknown) =>
  error as Bytes_toString.ErrorType
