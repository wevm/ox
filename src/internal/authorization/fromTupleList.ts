import type { GlobalErrorType } from '../errors/error.js'
import type { Compute, Mutable } from '../types.js'
import { Authorization_fromTuple } from './fromTuple.js'
import type {
  Authorization,
  Authorization_List,
  Authorization_TupleList,
} from './types.js'

/**
 * Converts an {@link Authorization#TupleList} to an {@link Authorization#List}.
 *
 * @example
 * // TODO
 */
export function Authorization_fromTupleList<
  const tupleList extends Authorization_TupleList,
>(tupleList: tupleList): Authorization_fromTupleList.ReturnType<tupleList> {
  const list: Mutable<Authorization_List> = []
  for (const tuple of tupleList) list.push(Authorization_fromTuple(tuple))
  return list as never
}

export declare namespace Authorization_fromTupleList {
  type ReturnType<tupleList extends Authorization_TupleList> = Compute<
    Authorization_TupleList<
      tupleList extends Authorization_TupleList<true> ? true : false
    >
  >

  type ErrorType = GlobalErrorType
}

Authorization_fromTupleList.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_fromTupleList.ErrorType
