import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import { Signature_extract } from '../Signature/extract.js'
import { Signature_toTuple } from '../Signature/toTuple.js'
import type { Signature } from '../Signature/types.js'
import type { Compute } from '../types.js'
import type { Authorization, Authorization_Tuple } from './types.js'

/**
 * Converts an {@link ox#Authorization.Authorization} to an {@link ox#Authorization.Tuple}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const tuple = Authorization.toTuple(authorization) // [!code focus]
 * // @log: [
 * // @log:   address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:   chainId: 1,
 * // @log:   nonce: 69n,
 * // @log: ]
 * ```
 *
 * @param authorization - The {@link ox#Authorization.Authorization}.
 * @returns An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple.
 */
export function Authorization_toTuple<
  const authorization extends Authorization,
>(
  authorization: authorization,
): Authorization_toTuple.ReturnType<authorization> {
  const { address, chainId, nonce } = authorization
  const signature = Signature_extract(authorization)
  return [
    chainId ? Hex_fromNumber(chainId) : '0x',
    address,
    nonce ? Hex_fromNumber(nonce) : '0x',
    ...(signature ? Signature_toTuple(signature) : []),
  ] as never
}

export declare namespace Authorization_toTuple {
  type ReturnType<authorization extends Authorization = Authorization> =
    Compute<Authorization_Tuple<authorization extends Signature ? true : false>>

  type ErrorType = GlobalErrorType
}

Authorization_toTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_toTuple.ErrorType
