import type * as Authorization from '../../Authorization.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as Signature from '../../Signature.js'
import type { Compute } from '../types.js'

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
  const authorization extends Authorization.Authorization,
>(
  authorization: authorization,
): Authorization.toTuple.ReturnType<authorization> {
  const { address, chainId, nonce } = authorization
  const signature = Signature.extract(authorization)
  return [
    chainId ? Hex.fromNumber(chainId) : '0x',
    address,
    nonce ? Hex.fromNumber(nonce) : '0x',
    ...(signature ? Signature.toTuple(signature) : []),
  ] as never
}

export declare namespace Authorization_toTuple {
  type ReturnType<
    authorization extends
      Authorization.Authorization = Authorization.Authorization,
  > = Compute<
    Authorization.Tuple<
      authorization extends Signature.Signature ? true : false
    >
  >

  type ErrorType =
    | Signature.extract.ErrorType
    | Hex.fromNumber.ErrorType
    | Signature.toTuple.ErrorType
    | Errors.GlobalErrorType
}

Authorization_toTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization.toTuple.ErrorType
