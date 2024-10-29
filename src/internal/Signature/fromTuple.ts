import type * as Errors from '../../Errors.js'
import { Signature_from } from './from.js'
import type { Signature, Signature_Tuple } from './types.js'

/**
 * Converts a {@link ox#Signature.Tuple} to a {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromTuple(['0x01', '0x7b', '0x1c8'])
 * // @log: {
 * // @log:   r: 123n,
 * // @log:   s: 456n,
 * // @log:   yParity: 1,
 * // @log: }
 * ```
 *
 * @param tuple - The {@link ox#Signature.Tuple} to convert.
 * @returns The {@link ox#Signature.Signature}.
 */
export function Signature_fromTuple(tuple: Signature_Tuple): Signature {
  const [yParity, r, s] = tuple
  return Signature_from({
    r: r === '0x' ? 0n : BigInt(r),
    s: s === '0x' ? 0n : BigInt(s),
    yParity: yParity === '0x' ? 0 : Number(yParity),
  })
}

export declare namespace Signature_fromTuple {
  type ErrorType = Signature_from.ErrorType | Errors.GlobalErrorType
}

Signature_fromTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_fromTuple.ErrorType
