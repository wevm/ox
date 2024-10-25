import type * as Bytes from '../../Bytes.js'
import * as Errors from '../../Errors.js'
import * as Json from '../../Json.js'

/**
 * Thrown when the bytes value cannot be represented as a boolean.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toBoolean(Bytes.from([5]))
 * // @error: Bytes.InvalidBytesBooleanError: Bytes value `[5]` is not a valid boolean.
 * // @error: The bytes array must contain a single byte of either a `0` or `1` value.
 * ```
 */
export class InvalidBytesBooleanError extends Errors.BaseError {
  override readonly name = 'Bytes.InvalidBytesBooleanError'

  constructor(bytes: Bytes.Bytes) {
    super(`Bytes value \`${bytes}\` is not a valid boolean.`, {
      docsPath: '/errors#bytesinvalidbytesbooleanerror',
      metaMessages: [
        'The bytes array must contain a single byte of either a `0` or `1` value.',
      ],
    })
  }
}

/**
 * Thrown when a value cannot be converted to bytes.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bytes } from 'ox'
 *
 * Bytes.from('foo')
 * // @error: Bytes.InvalidBytesTypeError: Value `foo` of type `string` is an invalid Bytes value.
 * ```
 */
export class InvalidBytesTypeError extends Errors.BaseError {
  override readonly name = 'Bytes.InvalidBytesTypeError'

  constructor(value: unknown) {
    super(
      `Value \`${typeof value === 'object' ? Json.stringify(value) : value}\` of type \`${typeof value}\` is an invalid Bytes value.`,
      {
        docsPath: '/errors#bytesinvalidbytestypeerror',
        metaMessages: ['Bytes values must be of type `Bytes`.'],
      },
    )
  }
}

/**
 * Thrown when a size exceeds the maximum allowed size.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.fromString('Hello World!', { size: 8 })
 * // @error: Bytes.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.
 * ```
 */
export class SizeOverflowError extends Errors.BaseError {
  override readonly name = 'Bytes.SizeOverflowError'

  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
      {
        docsPath: '/errors#bytessizeoverflowerror',
      },
    )
  }
}

/**
 * Thrown when a slice offset is out-of-bounds.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.slice(Bytes.from([1, 2, 3]), 4)
 * // @error: Bytes.SliceOffsetOutOfBoundsError: Slice starting at offset `4` is out-of-bounds (size: `3`).
 * ```
 */
export class SliceOffsetOutOfBoundsError extends Errors.BaseError {
  override readonly name = 'Bytes.SliceOffsetOutOfBoundsError'

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
        docsPath: '/errors#bytessliceoffsetoutofboundserror',
      },
    )
  }
}

/**
 * Thrown when a the padding size exceeds the maximum allowed size.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.padLeft(Bytes.fromString('Hello World!'), 8)
 * // @error: [Bytes.SizeExceedsPaddingSizeError: Bytes size (`12`) exceeds padding size (`8`).
 * ```
 */
export class SizeExceedsPaddingSizeError extends Errors.BaseError {
  override readonly name = 'Bytes.SizeExceedsPaddingSizeError'

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
        docsPath: '/errors#bytessizeexceedspaddingsizeerror',
      },
    )
  }
}
