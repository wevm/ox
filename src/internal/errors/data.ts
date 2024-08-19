import type { Bytes, Hex } from '../types/data.js'
import { BaseError } from './base.js'

// TODO: Use SizeOverflowError instead?
export class BytesSizeMismatchError extends BaseError {
  override readonly name = 'BytesSizeMismatchError'

  constructor({
    expectedSize,
    givenSize,
  }: { expectedSize: number; givenSize: number }) {
    super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
      docsPath: '/bytessizemismatcherror',
    })
  }
}

export class IntegerOutOfRangeError extends BaseError {
  override readonly name = 'IntegerOutOfRangeError'

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
      `Number \`${value}\` is not in safe ${
        size ? `${size * 8}-bit ${signed ? 'signed' : 'unsigned'} ` : ''
      }integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`,
      {
        docsPath: '/errors#integeroutofrangeerror',
      },
    )
  }
}

export class InvalidBytesBooleanError extends BaseError {
  override readonly name = 'InvalidBytesBooleanError'

  constructor(bytes: Bytes) {
    super(`Bytes value \`${bytes}\` is not a valid boolean.`, {
      docsPath: '/errors#invalidbytesbooleanerror',
      metaMessages: [
        'The bytes array must contain a single byte of either a `0` or `1` value.',
      ],
    })
  }
}

export class InvalidHexBooleanError extends BaseError {
  override readonly name = 'InvalidHexBooleanError'

  constructor(hex: Hex) {
    super(`Hex value \`"${hex}"\` is not a valid boolean.`, {
      docsPath: '/errors#invalidhexbooleanerror',
      metaMessages: [
        'The hex value must be `"0x0"` (false) or `"0x1"` (true).',
      ],
    })
  }
}

export class InvalidBytesTypeError extends BaseError {
  override readonly name = 'InvalidBytesTypeError'

  constructor(value: unknown) {
    super(
      // TODO: use `stringify` always.
      `Value \`${typeof value === 'object' ? JSON.stringify(value) : value}\` of type \`${typeof value}\` is an invalid Bytes value.`,
      {
        docsPath: '/errors#invalidbytestypeerror',
        metaMessages: ['Bytes values must be of type `Bytes`.'],
      },
    )
  }
}

export class InvalidHexLengthError extends BaseError {
  override readonly name = 'InvalidHexLengthError'

  constructor(value: Hex) {
    super(
      `Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`,
      {
        docsPath: '/errors#invalidhexlengtherror',
        metaMessages: ['It must be an even length.'],
      },
    )
  }
}

export class InvalidHexTypeError extends BaseError {
  override readonly name = 'InvalidHexTypeError'

  constructor(value: unknown) {
    super(
      // TODO: use `stringify` always.
      `Value \`${typeof value === 'object' ? JSON.stringify(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`,
      {
        docsPath: '/errors#invalidhextypeerror',
        metaMessages: ['Hex types must be represented as `"0x${string}"`.'],
      },
    )
  }
}

export class InvalidHexValueError extends BaseError {
  override readonly name = 'InvalidHexValueError'

  constructor(value: unknown) {
    super(`Value \`${value}\` is an invalid hex value.`, {
      docsPath: '/errors#invalidhexvalueerror',
      metaMessages: [
        'Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).',
      ],
    })
  }
}

export class InvalidTypeError extends BaseError {
  override readonly name = 'InvalidTypeError'

  constructor(type: string, expected: string) {
    super(`Type \`${type}\` is invalid. Expected: \`${expected}\``, {
      docsPath: '/errors#invalidtypeerror',
    })
  }
}

export class SizeOverflowError extends BaseError {
  override readonly name = 'SizeOverflowError'

  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
      {
        docsPath: '/errors#sizeoverflowerror',
      },
    )
  }
}

export class SliceOffsetOutOfBoundsError extends BaseError {
  override readonly name = 'SliceOffsetOutOfBoundsError'

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
        docsPath: '/errors#sliceoffsetoutofboundserror',
      },
    )
  }
}

export class SizeExceedsPaddingSizeError extends BaseError {
  override readonly name = 'SizeExceedsPaddingSizeError'

  constructor({
    size,
    targetSize,
    type,
  }: {
    size: number
    targetSize: number
    type: 'hex' | 'bytes'
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} size (\`${size}\`) exceeds padding size (\`${targetSize}\`).`,
      {
        docsPath: '/errors#sizeexceedspaddingsizeerror',
      },
    )
  }
}
