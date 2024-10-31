import type { Versions } from '@scure/bip32'
import type { Hex } from '../../Hex.js'
import type * as PublicKey from '../../PublicKey.js'

/** Root type for a Hierarchical Deterministic (HD) Key. */
export type HdKey = {
  derive: (path: string) => HdKey
  depth: number
  index: number
  identifier: Hex
  privateKey: Hex
  privateExtendedKey: string
  publicKey: PublicKey.PublicKey<false>
  publicExtendedKey: string
  versions: Versions
}
