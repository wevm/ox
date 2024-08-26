import type { Address } from 'abitype'
import type { Hex } from './data.js'
import type { Compute } from './utils.js'

export type AccessList_Item = {
  address: Address
  storageKeys: readonly Hex[]
}
export type AccessList_ItemTuple = Compute<
  [address: Address, storageKeys: readonly Hex[]]
>

export type AccessList = readonly AccessList_Item[]
export type AccessList_Tuple = readonly AccessList_ItemTuple[]
