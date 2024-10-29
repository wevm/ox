import * as Hex from '../../Hex.js'
// TODO: public
import { Address_assert } from '../Address/assert.js'
import type { Compute, Mutable } from '../types.js'
import { AccessList_InvalidStorageKeySizeError } from './errors.js'
import type { AccessList, AccessList_Tuple } from './types.js'

/** @internal */
export function AccessList_toTupleList(
  accessList?: AccessList | undefined,
): Compute<AccessList_Tuple> {
  if (!accessList || accessList.length === 0) return []

  const tuple: Mutable<AccessList_Tuple> = []
  for (const { address, storageKeys } of accessList) {
    for (let j = 0; j < storageKeys.length; j++)
      if (Hex.size(storageKeys[j]!) !== 32)
        throw new AccessList_InvalidStorageKeySizeError({
          storageKey: storageKeys[j]!,
        })

    if (address) Address_assert(address, { strict: false })

    tuple.push([address, storageKeys])
  }
  return tuple
}
