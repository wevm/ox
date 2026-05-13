import * as Errors from '../../Errors.js'

/**
 * Shared `SizeOverflowError` class for `Bytes` and `Hex`. The `name` is
 * passed at construction time so a single class identity backs both
 * `Bytes.SizeOverflowError` and `Hex.SizeOverflowError` re-exports without
 * forcing `Bytes` and `Hex` to import each other at runtime.
 *
 * @internal
 */
export class BytesSizeOverflowError extends Errors.BaseError {
  override readonly name = 'Bytes.SizeOverflowError'

  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
    )
  }
}

/** @internal */
export class HexSizeOverflowError extends Errors.BaseError {
  override readonly name = 'Hex.SizeOverflowError'

  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
    )
  }
}
