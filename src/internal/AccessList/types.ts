import type * as Address from '../../Address.js'
import type * as Hex from '../../Hex.js'
import type { Compute } from '../types.js'

export type AccessList = Compute<readonly AccessList_Item[]>

export type AccessList_Item = Compute<{
  address: Address.Address
  storageKeys: readonly Hex.Hex[]
}>

export type AccessList_ItemTuple = Compute<
  [address: Address.Address, storageKeys: readonly Hex.Hex[]]
>

export type AccessList_Tuple = readonly AccessList_ItemTuple[]
