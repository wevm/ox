import type { GlobalErrorType } from '../errors/error.js'
import type { SignatureTuple } from '../types/signature.js'
import { toSignature } from './toSignature.js'

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
export function fromSignatureTuple(signatureTuple: SignatureTuple) {
  const [yParity, r, s] = signatureTuple
  return toSignature({
    r: r === '0x' ? 0n : BigInt(r),
    s: s === '0x' ? 0n : BigInt(s),
    yParity: yParity === '0x' ? 0 : (Number(yParity) as 0 | 1),
  })
}

export declare namespace toSignatureTuple {
  type ErrorType = toSignature.ErrorType | GlobalErrorType
}
