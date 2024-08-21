import { assertAddress } from '../address/assert.js'
import { size } from '../data/size.js'
import { InvalidStorageKeySizeError } from '../errors/accessList.js'
import type { RecursiveArray } from '../rlp/encode.js'
import type { AccessList } from '../types/accessList.js'
import type { Hex } from '../types/data.js'

/** @internal */
export function serializeAccessList(
  accessList?: AccessList | undefined,
): RecursiveArray<Hex> {
  if (!accessList || accessList.length === 0) return []

  const serializedAccessList = []
  for (const { address, storageKeys } of accessList) {
    for (let j = 0; j < storageKeys.length; j++)
      if (size(storageKeys[j]!) !== 32)
        throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j]! })

    if (address) assertAddress(address, { strict: false })

    serializedAccessList.push([address, storageKeys])
  }
  return serializedAccessList
}
