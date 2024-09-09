import type { GlobalErrorType } from '../Errors/error.js'
import type { Compute, Mutable } from '../types.js'
import { Authorization_toTuple } from './toTuple.js'
import type { Authorization, Authorization_TupleList } from './types.js'

/**
 * Converts an {@link ox#Authorization.List} to an {@link ox#Authorization.TupleList}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization_1 = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 * const authorization_2 = Authorization.from({
 *   chainId: 3,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 20n,
 * })
 *
 * const tuple = Authorization.toTupleList([authorization_1, authorization_2]) // [!code focus]
 * // @log: [
 * // @log:   [
 * // @log:     chainId: 1,
 * // @log:     contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     nonce: 69n,
 * // @log:   ],
 * // @log:   [
 * // @log:     chainId: 3,
 * // @log:     contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     nonce: 20n,
 * // @log:   ],
 * // @log: ]
 * ```
 *
 * @param list - An {@link ox#Authorization.List}.
 * @returns An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple list.
 */
export function Authorization_toTupleList<
  const list extends
    | readonly Authorization<true>[]
    | readonly Authorization<false>[],
>(list?: list | undefined): Authorization_toTupleList.ReturnType<list> {
  if (!list || list.length === 0) return []

  const tupleList: Mutable<Authorization_TupleList> = []
  for (const authorization of list)
    tupleList.push(Authorization_toTuple(authorization))

  return tupleList as never
}

export declare namespace Authorization_toTupleList {
  type ReturnType<
    list extends
      | readonly Authorization<true>[]
      | readonly Authorization<false>[],
  > = Compute<
    Authorization_TupleList<
      list extends readonly Authorization<true>[] ? true : false
    >
  >

  type ErrorType = GlobalErrorType
}

Authorization_toTupleList.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_toTupleList.ErrorType
