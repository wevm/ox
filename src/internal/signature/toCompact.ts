import { Bytes_fromNumber } from '../bytes/from.js'
import { Bytes_toBigInt } from '../bytes/to.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Signature, Signature_Compact } from './types.js'

/**
 * Converts a {@link Signature#Signature} into an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) {@link Signature#Compact}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.toCompact({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 *   yParity: 0
 * })
 * // @log: {
 * // @log:   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * // @log:   yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n
 * // @log: }
 * ```
 *
 * @param signature - The {@link Signature#Signature} to convert.
 * @returns The {@link Signature#Compact}.
 */
export function Signature_toCompact(signature: Signature): Signature_Compact {
  const { r, s, yParity } = signature
  let yParityAndS = s
  if (yParity === 1) {
    const bytes = Bytes_fromNumber(s)
    bytes[0]! |= 0x80
    yParityAndS = Bytes_toBigInt(bytes)
  }
  return { r, yParityAndS }
}

export declare namespace Signature_toCompact {
  type ErrorType =
    | Bytes_fromNumber.ErrorType
    | Bytes_toBigInt.ErrorType
    | GlobalErrorType
}

Signature_toCompact.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_toCompact.ErrorType
