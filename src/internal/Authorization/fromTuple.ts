import type * as Errors from '../../Errors.js'
import { Signature_fromTuple } from '../Signature/fromTuple.js'
import type { Compute } from '../types.js'
import { Authorization_from } from './from.js'
import type { Authorization, Authorization_Tuple } from './types.js'

/**
 * Converts an {@link ox#Authorization.Tuple} to an {@link ox#Authorization.Authorization}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.fromTuple([
 *   '0x1',
 *   '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   '0x3'
 * ])
 * // @log: {
 * // @log:   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:   chainId: 1,
 * // @log:   nonce: 3n
 * // @log: }
 * ```
 *
 * @example
 * It is also possible to append a Signature tuple to the end of an Authorization tuple.
 *
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.fromTuple([
 *   '0x1',
 *   '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   '0x3',
 *   '0x1',
 *   '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90',
 *   '0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064',
 * ])
 * // @log: {
 * // @log:   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:   chainId: 1,
 * // @log:   nonce: 3n
 * // @log:   r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:   s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:   yParity: 0,
 * // @log: }
 * ```
 *
 * @param tuple - The [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple.
 * @returns The {@link ox#Authorization.Authorization}.
 */
export function Authorization_fromTuple<
  const tuple extends Authorization_Tuple,
>(tuple: tuple): Authorization_fromTuple.ReturnType<tuple> {
  const [chainId, address, nonce, yParity, r, s] = tuple
  const signature =
    yParity && r && s ? Signature_fromTuple([yParity, r, s]) : undefined
  return Authorization_from({
    address,
    chainId: Number(chainId),
    nonce: BigInt(nonce),
    ...signature,
  }) as never
}

export declare namespace Authorization_fromTuple {
  type ReturnType<
    authorization extends Authorization_Tuple = Authorization_Tuple,
  > = Compute<
    Authorization<
      authorization extends Authorization_Tuple<true> ? true : false
    >
  >

  type ErrorType = Errors.GlobalErrorType
}

Authorization_fromTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromTuple.ErrorType
