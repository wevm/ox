import { Address_assert } from '../Address/assert.js'
import { Hash_isHash } from '../Hash/isHash.js'
import { Hex_trimLeft } from '../Hex/trim.js'
import type { Hex } from '../Hex/types.js'
import type { Mutable } from '../types.js'
import type { AccessList, AccessList_Tuple } from './types.js'

/** @internal */
export function AccessList_fromTupleList(
  accessList_: AccessList_Tuple,
): AccessList {
  const accessList: Mutable<AccessList> = []
  for (let i = 0; i < accessList_.length; i++) {
    const [address, storageKeys] = accessList_[i] as [Hex, Hex[]]

    if (address) Address_assert(address, { strict: false })

    accessList.push({
      address: address,
      storageKeys: storageKeys.map((key) =>
        Hash_isHash(key) ? key : Hex_trimLeft(key),
      ),
    })
  }
  return accessList
}
