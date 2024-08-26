import type { GlobalErrorType } from '../errors/error.js'
import { Hex_from } from '../hex/from.js'
import { Hex_trimLeft } from '../hex/trim.js'
import type { Signature, Signature_Tuple } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Converts a {@link Signature#Signature} to a serialized {@link Signature#Tuple} to be used for signatures in Transaction Envelopes, EIP-7702 Authorization Lists, etc.
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
export function Signature_toTuple(
  signature: Signature,
): Signature_toTuple.ReturnType {
  const { r, s, yParity } = signature

  return [
    yParity ? '0x01' : '0x',
    r === 0n ? '0x' : Hex_trimLeft(Hex_from(r!)),
    s === 0n ? '0x' : Hex_trimLeft(Hex_from(s!)),
  ] as const
}

export declare namespace Signature_toTuple {
  type ReturnType = Compute<Signature_Tuple>

  type ErrorType = Hex_trimLeft.ErrorType | Hex_from.ErrorType | GlobalErrorType
}
