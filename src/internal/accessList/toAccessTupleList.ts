import { assertAddress } from '../address/assertAddress.js'
import { InvalidStorageKeySizeError } from '../errors/accessList.js'
import { size } from '../hex/size.js'
import type { AccessList, AccessTupleList } from '../types/accessList.js'
import type { Compute, Mutable } from '../types/utils.js'

/** @internal */
export function toAccessTupleList(
  accessList?: AccessList | undefined,
): Compute<AccessTupleList> {
  if (!accessList || accessList.length === 0) return []

  const tuple: Mutable<AccessTupleList> = []
  for (const { address, storageKeys } of accessList) {
    for (let j = 0; j < storageKeys.length; j++)
      if (size(storageKeys[j]!) !== 32)
        throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j]! })

    if (address) assertAddress(address, { strict: false })

    tuple.push([address, storageKeys])
  }
  return tuple
}
