import type { Address } from 'abitype'
import type { Hex } from './data.js'

export type AccessList = readonly {
  address: Address
  storageKeys: readonly Hex[]
}[]
