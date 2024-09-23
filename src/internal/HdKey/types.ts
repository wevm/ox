import type { HDKey, Versions } from '@scure/bip32'
import type { PublicKey } from '../PublicKey/types.js'
import type { Hex } from '../Hex/types.js'

export type HdKey = {
  derive: (path: string) => HdKey
  depth: number
  index: number
  identifier: Hex
  privateKey: Hex
  privateExtendedKey: string
  publicKey: PublicKey<false>
  publicExtendedKey: string
  versions: Versions
}
