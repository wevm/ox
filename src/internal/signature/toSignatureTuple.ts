import { trimLeft } from '../data/trim.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Signature, SignatureTuple } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Converts a {@link Signature} to a serialized {@link SignatureTuple} to be used for signatures in Transaction Envelopes, EIP-7702 Authorization Lists, etc.
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * const signatureTuple = Signature.toTuple({
 *   r: 123n,
 *   s: 456n,
 *   yParity: 1,
 * })
 * // [yParity: '0x01', r: '0x7b', s: '0x1c8']
 * ```
 */
export function toSignatureTuple(
  signature: Signature,
): toSignatureTuple.ReturnType {
  const { r, s, yParity } = signature

  return [
    yParity ? '0x01' : '0x',
    r === 0n ? '0x' : trimLeft(toHex(r!)),
    s === 0n ? '0x' : trimLeft(toHex(s!)),
  ] as const
}

export declare namespace toSignatureTuple {
  type ReturnType = Compute<SignatureTuple>

  type ErrorType = trimLeft.ErrorType | toHex.ErrorType | GlobalErrorType
}
