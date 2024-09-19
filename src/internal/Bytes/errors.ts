import type { Bytes } from '../Bytes/types.js'
import { BaseError } from '../Errors/base.js'
import { Json_stringify } from '../Json/stringify.js'

export class Bytes_InvalidBytesBooleanError extends BaseError {
  override readonly name = 'Bytes.InvalidBytesBooleanError'

  constructor(bytes: Bytes) {
    super(`Bytes value \`${bytes}\` is not a valid boolean.`, {
      docsPath: '/errors#bytesinvalidbytesbooleanerror',
      metaMessages: [
        'The bytes array must contain a single byte of either a `0` or `1` value.',
      ],
    })
  }
}

export class Bytes_InvalidBytesTypeError extends BaseError {
  override readonly name = 'Bytes.InvalidBytesTypeError'

  constructor(value: unknown) {
    super(
      `Value \`${typeof value === 'object' ? Json_stringify(value) : value}\` of type \`${typeof value}\` is an invalid Bytes value.`,
      {
        docsPath: '/errors#bytesinvalidbytestypeerror',
        metaMessages: ['Bytes values must be of type `Bytes`.'],
      },
    )
  }
}

export class Bytes_SizeOverflowError extends BaseError {
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

export class Bytes_SliceOffsetOutOfBoundsError extends BaseError {
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

export class Bytes_SizeExceedsPaddingSizeError extends BaseError {
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
