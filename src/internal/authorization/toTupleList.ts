import type { GlobalErrorType } from '../errors/error.js'
import type {
  Authorization,
  Authorization_TupleList,
} from '../types/authorization.js'
import type { Compute, Mutable } from '../types/utils.js'
import { Authorization_toTuple } from './toTuple.js'

/**
 * Converts an {@link Types#AuthorizationList} to an {@link Types#AuthorizationTupleList}.
 *
 * @example
 * // TODO
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
