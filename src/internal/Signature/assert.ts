import type { GlobalErrorType } from '../Errors/error.js'
import { Solidity_maxUint256 } from '../Solidity/constants.js'
import type { ExactPartial } from '../types.js'
import {
  InvalidSignatureRError,
  InvalidSignatureSError,
  InvalidSignatureYParityError,
  MissingSignaturePropertiesError,
} from './errors.js'
import type { Signature } from './types.js'

/**
 * Asserts that a Signature is valid.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.assert({
 *   r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @error: InvalidSignatureRError:
 * // @error: Value `-549...n` is an invalid r value.
 * // @error: r must be a positive integer less than 2^256.
 * ```
 *
 * @param signature - The signature object to assert.
 */
export function Signature_assert(
  signature: ExactPartial<Signature>,
): asserts signature is Signature {
  if (typeof signature.r === 'undefined')
    throw new MissingSignaturePropertiesError({ signature })
  if (typeof signature.s === 'undefined')
    throw new MissingSignaturePropertiesError({ signature })
  if (typeof signature.yParity === 'undefined')
    throw new MissingSignaturePropertiesError({ signature })
  if (signature.r < 0n || signature.r > Solidity_maxUint256)
    throw new InvalidSignatureRError({ value: signature.r })
  if (signature.s < 0n || signature.s > Solidity_maxUint256)
    throw new InvalidSignatureSError({ value: signature.s })
  if (signature.yParity !== 0 && signature.yParity !== 1)
    throw new InvalidSignatureYParityError({ value: signature.yParity })
}

export declare namespace Signature_assert {
  type ErrorType =
    | MissingSignaturePropertiesError
    | InvalidSignatureRError
    | InvalidSignatureSError
    | InvalidSignatureYParityError
    | GlobalErrorType
}
