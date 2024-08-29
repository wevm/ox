import type { Address } from '../address/types.js'
import type { Hex } from '../hex/types.js'
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
