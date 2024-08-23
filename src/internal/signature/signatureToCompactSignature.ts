import { bytesToBigInt } from '../bytes/fromBytes.js'
import { numberToBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { CompactSignature, Signature } from '../types/signature.js'

/**
 * Converts a {@link Types#Signature} into an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) {@link Types#CompactSignature}.
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
 * // {
 * //   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * //   yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n
 * // }
 * ```
 */
export function signatureToCompactSignature(
  signature: Signature,
): CompactSignature {
  const { r, s, yParity } = signature
  let yParityAndS = s
  if (yParity === 1) {
    const bytes = numberToBytes(s)
    bytes[0]! |= 0x80
    yParityAndS = bytesToBigInt(bytes)
  }
  return { r, yParityAndS }
}

export declare namespace signatureToCompactSignature {
  type ErrorType =
    | numberToBytes.ErrorType
    | bytesToBigInt.ErrorType
    | GlobalErrorType
}

signatureToCompactSignature.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as signatureToCompactSignature.ErrorType
