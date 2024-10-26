import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

export type AccessList = Compute<readonly Item[]>

export type Item = Compute<{
  address: Address
  storageKeys: readonly Hex[]
}>

export type ItemTuple = Compute<[address: Address, storageKeys: readonly Hex[]]>

export type Tuple = readonly ItemTuple[]
