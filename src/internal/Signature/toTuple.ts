import type * as Errors from '../../Errors.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import { Hex_trimLeft } from '../Hex/trim.js'
import type { Signature, Signature_Tuple } from './types.js'

/**
 * Converts a {@link ox#Signature.Signature} to a serialized {@link ox#Signature.Tuple} to be used for signatures in Transaction Envelopes, EIP-7702 Authorization Lists, etc.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signatureTuple = Signature.toTuple({
 *   r: 123n,
 *   s: 456n,
 *   yParity: 1,
 * })
 * // @log: [yParity: '0x01', r: '0x7b', s: '0x1c8']
 * ```
 *
 * @param signature - The {@link ox#Signature.Signature} to convert.
 * @returns The {@link ox#Signature.Tuple}.
 */
export function Signature_toTuple(signature: Signature): Signature_Tuple {
  const { r, s, yParity } = signature

  return [
    yParity ? '0x01' : '0x',
    r === 0n ? '0x' : Hex_trimLeft(Hex_fromNumber(r!)),
    s === 0n ? '0x' : Hex_trimLeft(Hex_fromNumber(s!)),
  ] as const
}

export declare namespace Signature_toTuple {
  type ErrorType =
    | Hex_trimLeft.ErrorType
    | Hex_fromNumber.ErrorType
    | Errors.GlobalErrorType
}
