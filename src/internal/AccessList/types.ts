import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

export type AccessList = Compute<readonly AccessList_Item[]>

export type AccessList_Item = Compute<{
  address: Address
  storageKeys: readonly Hex[]
}>

export type AccessList_ItemTuple = Compute<
  [address: Address, storageKeys: readonly Hex[]]
>

export type AccessList_Tuple = readonly AccessList_ItemTuple[]
