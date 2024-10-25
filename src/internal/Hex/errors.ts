import * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import * as Json from '../../Json.js'

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
      {
        docsPath: '/errors#hexintegeroutofrangeerror',
      },
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

  constructor(hex: Hex.Hex) {
    super(`Hex value \`"${hex}"\` is not a valid boolean.`, {
      docsPath: '/errors#hexinvalidhexbooleanerror',
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
        docsPath: '/errors#hexinvalidhextypeerror',
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
      docsPath: '/errors#hexinvalidhexvalueerror',
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

  constructor(value: Hex.Hex) {
    super(
      `Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`,
      {
        docsPath: '/errors#bytesinvalidhexlengtherror',
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
      {
        docsPath: '/errors#hexsizeoverflowerror',
      },
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
      {
        docsPath: '/errors#hexsliceoffsetoutofboundserror',
      },
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
      {
        docsPath: '/errors#hexsizeexceedspaddingsizeerror',
      },
    )
  }
}
