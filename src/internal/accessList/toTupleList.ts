import { Address_assert } from '../address/assert.js'
import { Hex_size } from '../hex/size.js'
import type { Compute, Mutable } from '../types.js'
import { InvalidStorageKeySizeError } from './errors.js'
import type { AccessList, AccessList_Tuple } from './types.js'

/** @internal */
export function AccessList_toTupleList(
  accessList?: AccessList | undefined,
): Compute<AccessList_Tuple> {
  if (!accessList || accessList.length === 0) return []

  const tuple: Mutable<AccessList_Tuple> = []
  for (const { address, storageKeys } of accessList) {
    for (let j = 0; j < storageKeys.length; j++)
      if (Hex_size(storageKeys[j]!) !== 32)
        throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j]! })

    if (address) Address_assert(address, { strict: false })

    tuple.push([address, storageKeys])
  }
  return tuple
}
