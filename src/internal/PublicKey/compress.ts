import type * as Errors from '../../Errors.js'
import type { PublicKey } from './types.js'

/**
 * Compresses a {@link ox#PublicKey.PublicKey}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const compressed = PublicKey.compress(publicKey) // [!code focus]
 * // @log: {
 * // @log:   prefix: 3,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log: }
 * ```
 *
 * @param publicKey - The public key to compress.
 * @returns The compressed public key.
 */
export function PublicKey_compress(
  publicKey: PublicKey<false>,
): PublicKey<true> {
  const { x, y } = publicKey
  return {
    prefix: y % 2n === 0n ? 2 : 3,
    x,
  }
}

export declare namespace PublicKey_compress {
  type ErrorType = Errors.GlobalErrorType
}

PublicKey_compress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as PublicKey_compress.ErrorType
