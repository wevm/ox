import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { Compute, Mutable } from '../types.js'
import { InvalidStorageKeySizeError } from './errors.js'
import type { AccessList, Tuple } from './types.js'

/** @internal */
export function toTupleList(
  accessList?: AccessList | undefined,
): Compute<Tuple> {
  if (!accessList || accessList.length === 0) return []

  const tuple: Mutable<Tuple> = []
  for (const { address, storageKeys } of accessList) {
    for (let j = 0; j < storageKeys.length; j++)
      if (Hex.size(storageKeys[j]!) !== 32)
        throw new InvalidStorageKeySizeError({
          storageKey: storageKeys[j]!,
        })

    if (address) Address.assert(address, { strict: false })

    tuple.push([address, storageKeys])
  }
  return tuple
}

/** @internal */
export declare namespace toTupleList {
  type ErrorType =
    | Address.assert.ErrorType
    | InvalidStorageKeySizeError
    | Errors.GlobalErrorType
}
