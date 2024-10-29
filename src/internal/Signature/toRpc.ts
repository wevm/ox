import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { Signature, Signature_Rpc } from './types.js'

/**
 * Converts a {@link ox#Signature.Signature} into a {@link ox#Signature.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.toRpc({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * })
 * ```
 *
 * @param signature - The {@link ox#Signature.Signature} to convert.
 * @returns The converted {@link ox#Signature.Rpc}.
 */
export function Signature_toRpc(signature: Signature): Signature_Rpc {
  const { r, s, yParity } = signature
  return {
    r: Hex.fromNumber(r, { size: 32 }),
    s: Hex.fromNumber(s, { size: 32 }),
    yParity: yParity === 0 ? '0x0' : '0x1',
  }
}

export declare namespace Signature_toRpc {
  type ErrorType = Errors.GlobalErrorType
}

Signature_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_toRpc.ErrorType
