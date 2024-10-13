import type { GlobalErrorType } from '../Errors/error.js'
import type { Compute, Mutable } from '../types.js'
import { Authorization_fromTuple } from './fromTuple.js'
import type { Authorization_List, Authorization_TupleList } from './types.js'

/**
 * Converts an {@link ox#Authorization.TupleList} to an {@link ox#Authorization.List}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorizationList = Authorization.fromTupleList([
 *   ['0x1', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x3'],
 *   ['0x3', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14'],
 * ])
 * // @log: [
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 1,
 * // @log:     nonce: 3n,
 * // @log:   },
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:   },
 * // @log: ]
 * ```
 *
 * @example
 * It is also possible to append a Signature tuple to the end of an Authorization tuple.
 *
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorizationList = Authorization.fromTupleList([
 *   ['0x1', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x3', '0x1', '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90', '0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'],
 *   ['0x3', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14', '0x1', '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90', '0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'],
 * ])
 * // @log: [
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 1,
 * // @log:     nonce: 3n,
 * // @log:     r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:     s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:     yParity: 0,
 * // @log:   },
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:     r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:     s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:     yParity: 0,
 * // @log:   },
 * // @log: ]
 * ```
 *
 * @param tupleList - The [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple list.
 * @returns An {@link ox#Authorization.List}.
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
