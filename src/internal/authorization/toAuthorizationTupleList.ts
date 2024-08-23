import type { GlobalErrorType } from '../errors/error.js'
import type {
  Authorization,
  AuthorizationTupleList,
} from '../types/authorization.js'
import type { Compute, Mutable } from '../types/utils.js'
import { toAuthorizationTuple } from './toAuthorizationTuple.js'

/**
 * Converts an {@link AuthorizationList} to an {@link AuthorizationTupleList}.
 *
 * @example
 * // TODO
 */
export function toAuthorizationTupleList<
  const list extends
    | readonly Authorization<true>[]
    | readonly Authorization<false>[],
>(list?: list | undefined): toAuthorizationTupleList.ReturnType<list> {
  if (!list || list.length === 0) return []

  const tupleList: Mutable<AuthorizationTupleList> = []
  for (const authorization of list)
    tupleList.push(toAuthorizationTuple(authorization))

  return tupleList as never
}

export declare namespace toAuthorizationTupleList {
  type ReturnType<
    list extends
      | readonly Authorization<true>[]
      | readonly Authorization<false>[],
  > = Compute<
    AuthorizationTupleList<
      list extends readonly Authorization<true>[] ? true : false
    >
  >

  type ErrorType = GlobalErrorType
}

toAuthorizationTupleList.parseError = (error: unknown) =>
  error as toAuthorizationTupleList.ErrorType
