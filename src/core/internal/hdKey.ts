import type { HDKey } from '@scure/bip32'
import type * as Errors from '../Errors.js'
import type * as HdKey from '../HdKey.js'
import * as Hex from '../Hex.js'
import * as Secp256k1 from '../Secp256k1.js'

/**
 * @internal
 *
 * Wraps a `@scure/bip32` `HDKey` in ox's `HdKey` shape using lazy getters.
 *
 * The eager wrapper paid `Hex.fromBytes` for `identifier`/`privateKey` and
 * a full `Secp256k1.getPublicKey` derivation for every node materialized
 * along a derivation path - even for callers that only read `privateKey`
 * at the leaf. Lazy getters make BIP44 walks (5 deep nodes) cheap when
 * intermediate fields are unused.
 */
export function fromScure(key: HDKey): HdKey.HdKey {
  let identifier: HdKey.HdKey['identifier'] | undefined
  let privateKey: HdKey.HdKey['privateKey'] | undefined
  let publicKey: HdKey.HdKey['publicKey'] | undefined
  return {
    derive: (path) => fromScure(key.derive(path)),
    depth: key.depth,
    get identifier() {
      if (identifier === undefined) identifier = Hex.fromBytes(key.identifier!)
      return identifier
    },
    index: key.index,
    get privateKey() {
      if (privateKey === undefined) privateKey = Hex.fromBytes(key.privateKey!)
      return privateKey
    },
    privateExtendedKey: key.privateExtendedKey,
    get publicKey() {
      if (publicKey === undefined)
        publicKey = Secp256k1.getPublicKey({ privateKey: key.privateKey! })
      return publicKey
    },
    publicExtendedKey: key.publicExtendedKey,
    versions: key.versions,
  }
}

/** @internal */
export declare namespace fromScure {
  type ErrorType = Errors.GlobalErrorType
}
