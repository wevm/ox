import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import { Signature_from } from './from.js'
import type { Signature } from './types.js'

/**
 * Extracts a {@link Signature#Signature} from an arbitrary object that may include signature properties.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Signature } from 'ox'
 *
 * Signature.extract({
 *   baz: 'barry',
 *   foo: 'bar',
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 *   zebra: 'stripes',
 * })
 * // @log: {
 * // @log:   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * // @log:   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * // @log:   yParity: 1
 * // @log: }
 * ```
 *
 * @param value - The arbitrary object to extract the signature from.
 * @returns The extracted {@link Signature#Signature}.
 */
export function Signature_extract(
  value: Signature_extract.Value,
): Signature | undefined {
  if (typeof value.r === 'undefined') return undefined
  if (typeof value.s === 'undefined') return undefined
  return Signature_from(value as any)
}

export declare namespace Signature_extract {
  type Value = {
    r?: bigint | Hex | undefined
    s?: bigint | Hex | undefined
    yParity?: number | Hex | undefined
    v?: number | Hex | undefined
  }
  type ErrorType = GlobalErrorType
}

Signature_extract.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_extract.ErrorType
