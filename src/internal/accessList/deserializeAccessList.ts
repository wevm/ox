import { assertAddress } from '../address/assertAddress.js'
import { trimLeft } from '../data/trim.js'
import { isHash } from '../hash/isHash.js'
import type { RecursiveArray } from '../rlp/encodeRlp.js'
import type { AccessList } from '../types/accessList.js'
import type { Hex } from '../types/data.js'
import type { Mutable } from '../types/utils.js'

/** @internal */
export function deserializeAccessList(
  accessList_: RecursiveArray<Hex>,
): AccessList {
  const accessList: Mutable<AccessList> = []
  for (let i = 0; i < accessList_.length; i++) {
    const [address, storageKeys] = accessList_[i] as [Hex, Hex[]]

    if (address) assertAddress(address, { strict: false })

    accessList.push({
      address: address,
      storageKeys: storageKeys.map((key) =>
        isHash(key) ? key : trimLeft(key),
      ),
    })
  }
  return accessList
}
