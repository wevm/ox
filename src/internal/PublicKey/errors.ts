import type { Bytes } from '../Bytes/types.js'
import { BaseError } from '../Errors/base.js'
import { Hex_from } from '../Hex/from.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'
import { stringify } from '../stringify.js'

export class PublicKey_InvalidError extends BaseError {
  override readonly name = 'PublicKey.InvalidError'

  constructor({ publicKey }: { publicKey: unknown }) {
    super(`Value \`${stringify(publicKey)}\` is not a valid public key.`, {
      metaMessages: [
        'Public key must contain:',
        '- an `x` and `prefix` value (compressed)',
        '- an `x`, `y`, and `prefix` value (uncompressed)',
      ],
    })
  }
}

export class PublicKey_InvalidPrefixError<
  cause extends
    | PublicKey_InvalidCompressedPrefixError
    | PublicKey_InvalidUncompressedPrefixError =
    | PublicKey_InvalidCompressedPrefixError
    | PublicKey_InvalidUncompressedPrefixError,
> extends BaseError<cause> {
  override readonly name = 'PublicKey.InvalidPrefixError'

  constructor({ prefix, cause }: { prefix: number | undefined; cause: cause }) {
    super(`Prefix "${prefix}" is invalid.`, {
      cause,
    })
  }
}

export class PublicKey_InvalidCompressedPrefixError extends BaseError {
  override readonly name = 'PublicKey.InvalidCompressedPrefixError'

  constructor() {
    super('Prefix must be 2 or 3 for compressed public keys.')
  }
}

export class PublicKey_InvalidUncompressedPrefixError extends BaseError {
  override readonly name = 'PublicKey.InvalidUncompressedPrefixError'

  constructor() {
    super('Prefix must be 4 for uncompressed public keys.')
  }
}

export class PublicKey_InvalidSerializedSizeError extends BaseError {
  override readonly name = 'PublicKey.InvalidSerializedSizeError'

  constructor({ publicKey }: { publicKey: Hex | Bytes }) {
    super(`Value \`${publicKey}\` is an invalid public key size.`, {
      metaMessages: [
        'Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).',
        `Received ${Hex_size(Hex_from(publicKey))} bytes.`,
      ],
    })
  }
}
