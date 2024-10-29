import * as Hex from '../../Hex.js'
// TODO: public
import { Address_assert } from '../Address/assert.js'
import { Hash_validate } from '../Hash/validate.js'
import type { Mutable } from '../types.js'
import type { AccessList, AccessList_Tuple } from './types.js'

/** @internal */
export function AccessList_fromTupleList(
  accessList_: AccessList_Tuple,
): AccessList {
  const accessList: Mutable<AccessList> = []
  for (let i = 0; i < accessList_.length; i++) {
    const [address, storageKeys] = accessList_[i] as [Hex.Hex, Hex.Hex[]]

    if (address) Address_assert(address, { strict: false })

    accessList.push({
      address: address,
      storageKeys: storageKeys.map((key) =>
        Hash_validate(key) ? key : Hex.trimLeft(key),
      ),
    })
  }
  return accessList
}
