import type { Bytes } from '../../Bytes.js'
import { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import { Json_stringify } from '../Json/stringify.js'

/**
 * Thrown when a public key is invalid.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * PublicKey.assert({ y: 1n })
 * // @error: PublicKey.InvalidError: Value `{"y":1n}` is not a valid public key.
 * // @error: Public key must contain:
 * // @error: - an `x` and `prefix` value (compressed)
 * // @error: - an `x`, `y`, and `prefix` value (uncompressed)
 * ```
 */
export class PublicKey_InvalidError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidError'

  constructor({ publicKey }: { publicKey: unknown }) {
    super(`Value \`${Json_stringify(publicKey)}\` is not a valid public key.`, {
      metaMessages: [
        'Public key must contain:',
        '- an `x` and `prefix` value (compressed)',
        '- an `x`, `y`, and `prefix` value (uncompressed)',
      ],
    })
  }
}

/** Thrown when a public key has an invalid prefix. */
export class PublicKey_InvalidPrefixError<
  cause extends
    | PublicKey_InvalidCompressedPrefixError
    | PublicKey_InvalidUncompressedPrefixError =
    | PublicKey_InvalidCompressedPrefixError
    | PublicKey_InvalidUncompressedPrefixError,
> extends Errors.BaseError<cause> {
  override readonly name = 'PublicKey.InvalidPrefixError'

  constructor({ prefix, cause }: { prefix: number | undefined; cause: cause }) {
    super(`Prefix "${prefix}" is invalid.`, {
      cause,
    })
  }
}

/** Thrown when the public key has an invalid prefix for a compressed public key. */
export class PublicKey_InvalidCompressedPrefixError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidCompressedPrefixError'

  constructor() {
    super('Prefix must be 2 or 3 for compressed public keys.')
  }
}

/** Thrown when the public key has an invalid prefix for an uncompressed public key. */
export class PublicKey_InvalidUncompressedPrefixError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidUncompressedPrefixError'

  constructor() {
    super('Prefix must be 4 for uncompressed public keys.')
  }
}

/** Thrown when the public key has an invalid serialized size. */
export class PublicKey_InvalidSerializedSizeError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidSerializedSizeError'

  constructor({ publicKey }: { publicKey: Hex | Bytes }) {
    super(`Value \`${publicKey}\` is an invalid public key size.`, {
      metaMessages: [
        'Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).',
        `Received ${Hex.size(Hex.from(publicKey))} bytes.`,
      ],
    })
  }
}
