import { BaseError } from '../Errors/base.js'
import type { Hex } from '../Hex/types.js'
import { Json_stringify } from '../Json/stringify.js'

export class Hex_IntegerOutOfRangeError extends BaseError {
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

export class Hex_InvalidHexBooleanError extends BaseError {
  override readonly name = 'Hex.InvalidHexBooleanError'

  constructor(hex: Hex) {
    super(`Hex value \`"${hex}"\` is not a valid boolean.`, {
      docsPath: '/errors#hexinvalidhexbooleanerror',
      metaMessages: [
        'The hex value must be `"0x0"` (false) or `"0x1"` (true).',
      ],
    })
  }
}

export class Hex_InvalidHexTypeError extends BaseError {
  override readonly name = 'Hex.InvalidHexTypeError'

  constructor(value: unknown) {
    super(
      `Value \`${typeof value === 'object' ? Json_stringify(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`,
      {
        docsPath: '/errors#hexinvalidhextypeerror',
        metaMessages: ['Hex types must be represented as `"0x${string}"`.'],
      },
    )
  }
}

export class Hex_InvalidHexValueError extends BaseError {
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

export class Hex_InvalidLengthError extends BaseError {
  override readonly name = 'Hex.InvalidLengthError'

  constructor(value: Hex) {
    super(
      `Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`,
      {
        docsPath: '/errors#bytesinvalidhexlengtherror',
        metaMessages: ['It must be an even length.'],
      },
    )
  }
}

export class Hex_SizeOverflowError extends BaseError {
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

export class Hex_SliceOffsetOutOfBoundsError extends BaseError {
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

export class Hex_SizeExceedsPaddingSizeError extends BaseError {
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
