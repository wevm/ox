import type { GlobalErrorType } from '../errors/error.js'
import type { Signature_Tuple } from '../types/signature.js'
import { Signature_from } from './from.js'

/**
 * Converts a {@link Types#SignatureTuple} to a {@link Types#Signature}.
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromTuple(['0x01', '0x7b', '0x1c8'])
 * // {
 * //   r: 123n,
 * //   s: 456n,
 * //   yParity: 1,
 * // }
 * ```
 */
export function Signature_fromTuple(tuple: Signature_Tuple) {
  const [yParity, r, s] = tuple
  return Signature_from({
    r: r === '0x' ? 0n : BigInt(r),
    s: s === '0x' ? 0n : BigInt(s),
    yParity: yParity === '0x' ? 0 : (Number(yParity) as 0 | 1),
  })
}

export declare namespace Signature_fromTuple {
  type ErrorType = Signature_from.ErrorType | GlobalErrorType
}

Signature_fromTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_fromTuple.ErrorType
