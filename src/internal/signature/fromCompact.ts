import { Bytes_fromNumber } from '../bytes/from.js'
import { Bytes_toBigInt } from '../bytes/to.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Signature, Signature_Compact } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Converts an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) {@link Types#SignatureCompact} into a {@link Types#Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.fromCompact({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * })
 *
 * // {
 * //   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * //   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * //   yParity: 0
 * // }
 * ```
 */
export function Signature_fromCompact({
  r,
  yParityAndS,
}: Signature_Compact): Compute<Signature> {
  const yParityAndS_bytes = Bytes_fromNumber(yParityAndS)
  const yParity = yParityAndS_bytes[0]! & 0x80 ? 1 : 0
  const s = yParityAndS_bytes
  if (yParity === 1) s[0]! &= 0x7f
  return { r, s: Bytes_toBigInt(s), yParity }
}

export declare namespace Signature_fromCompact {
  type ErrorType =
    | Bytes_fromNumber.ErrorType
    | Bytes_toBigInt.ErrorType
    | GlobalErrorType
}

Signature_fromCompact.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_fromCompact.ErrorType
