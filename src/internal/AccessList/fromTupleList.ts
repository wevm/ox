import * as Address from '../../Address.js'
import * as Hash from '../../Hash.js'
import * as Hex from '../../Hex.js'
import type * as Errors from '../../Errors.js'
import type { Mutable } from '../types.js'
import type { AccessList, AccessList_Tuple } from './types.js'

/** @internal */
export function AccessList_fromTupleList(
  accessList_: AccessList_Tuple,
): AccessList {
  const accessList: Mutable<AccessList> = []
  for (let i = 0; i < accessList_.length; i++) {
    const [address, storageKeys] = accessList_[i] as [Hex.Hex, Hex.Hex[]]

    if (address) Address.assert(address, { strict: false })

    accessList.push({
      address: address,
      storageKeys: storageKeys.map((key) =>
        Hash.validate(key) ? key : Hex.trimLeft(key),
      ),
    })
  }
  return accessList
}

/** @internal */
export declare namespace AccessList_fromTupleList {
  type ErrorType = Address.assert.ErrorType | Errors.GlobalErrorType
}
