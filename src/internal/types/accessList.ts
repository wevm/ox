import type { Address } from 'abitype'
import type { Hex } from './data.js'
import type { Compute } from './utils.js'

export type AccessItem = {
  address: Address
  storageKeys: readonly Hex[]
}
export type AccessTuple = Compute<
  [address: Address, storageKeys: readonly Hex[]]
>

export type AccessList = readonly AccessItem[]
export type AccessTupleList = readonly AccessTuple[]
