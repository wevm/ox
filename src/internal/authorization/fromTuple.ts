import type { GlobalErrorType } from '../errors/error.js'
import { Signature_fromTuple } from '../signature/fromTuple.js'
import type { Compute } from '../types.js'
import { Authorization_from } from './from.js'
import type { Authorization, Authorization_Tuple } from './types.js'

/**
 * Converts an {@link Authorization#Tuple} to an {@link Authorization#Authorization}.
 *
 * @example
 * // TODO
 */
export function Authorization_fromTuple<
  const tuple extends Authorization_Tuple,
>(tuple: tuple): Authorization_fromTuple.ReturnType<tuple> {
  const [chainId, contractAddress, nonce, yParity, r, s] = tuple
  const signature =
    yParity && r && s ? Signature_fromTuple([yParity, r, s]) : undefined
  return Authorization_from({
    chainId: Number(chainId),
    contractAddress,
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

  type ErrorType = GlobalErrorType
}

Authorization_fromTuple.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromTuple.ErrorType
