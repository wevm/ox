import * as Authorization from '../../Authorization.js'
import type * as Errors from '../../Errors.js'
import type { Mutable } from '../types.js'

/**
 * Converts an {@link ox#Authorization.List} to an {@link ox#Authorization.TupleList}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization_1 = Authorization.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 * const authorization_2 = Authorization.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 3,
 *   nonce: 20n,
 * })
 *
 * const tuple = Authorization.toTupleList([authorization_1, authorization_2]) // [!code focus]
 * // @log: [
 * // @log:   [
 * // @log:     address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     chainId: 1,
 * // @log:     nonce: 69n,
 * // @log:   ],
 * // @log:   [
 * // @log:     address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:   ],
 * // @log: ]
 * ```
 *
 * @param list - An {@link ox#Authorization.List}.
 * @returns An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple list.
 */
export function toTupleList<
  const list extends readonly Authorization.Authorization[],
>(list?: list | undefined): Authorization.toTupleList.ReturnType<list> {
  if (!list || list.length === 0) return []

  const tupleList: Mutable<Authorization.TupleList> = []
  for (const authorization of list)
    tupleList.push(Authorization.toTuple(authorization))

  return tupleList as never
}

export declare namespace toTupleList {
  type ReturnType<list extends readonly Authorization.Authorization[]> =
    list extends readonly Authorization.Signed[]
      ? Authorization.TupleListSigned
      : Authorization.TupleList

  type ErrorType = Authorization.toTuple.ErrorType | Errors.GlobalErrorType
}

toTupleList.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization.toTupleList.ErrorType
