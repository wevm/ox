import type * as Errors from '../../Errors.js'
import type { ExactPartial } from '../types.js'
import {
  PublicKey_InvalidCompressedPrefixError,
  PublicKey_InvalidError,
  PublicKey_InvalidPrefixError,
  PublicKey_InvalidUncompressedPrefixError,
} from './errors.js'
import type { PublicKey } from './types.js'

/**
 * Asserts that a {@link ox#PublicKey.PublicKey} is valid.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * PublicKey.assert({
 *   prefix: 4,
 *   y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * })
 * // @error: PublicKey.InvalidError: Value \`{"y":"1"}\` is not a valid public key.
 * // @error: Public key must contain:
 * // @error: - an `x` and `prefix` value (compressed)
 * // @error: - an `x`, `y`, and `prefix` value (uncompressed)
 * ```
 *
 * @param publicKey - The public key object to assert.
 */
export function PublicKey_assert(
  publicKey: ExactPartial<PublicKey>,
  options: PublicKey_assert.Options = {},
): asserts publicKey is PublicKey {
  const { compressed } = options
  const { prefix, x, y } = publicKey

  // Uncompressed
  if (
    compressed === false ||
    (typeof x === 'bigint' && typeof y === 'bigint')
  ) {
    if (prefix !== 4)
      throw new PublicKey_InvalidPrefixError({
        prefix,
        cause: new PublicKey_InvalidUncompressedPrefixError(),
      })
    return
  }

  // Compressed
  if (
    compressed === true ||
    (typeof x === 'bigint' && typeof y === 'undefined')
  ) {
    if (prefix !== 3 && prefix !== 2)
      throw new PublicKey_InvalidPrefixError({
        prefix,
        cause: new PublicKey_InvalidCompressedPrefixError(),
      })
    return
  }

  // Unknown/invalid
  throw new PublicKey_InvalidError({ publicKey })
}

export declare namespace PublicKey_assert {
  type Options = {
    /** Whether or not the public key should be compressed. */
    compressed?: boolean
  }

  type ErrorType =
    | PublicKey_InvalidError
    | PublicKey_InvalidPrefixError
    | Errors.GlobalErrorType
}
