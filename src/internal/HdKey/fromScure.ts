import type { HDKey } from '@scure/bip32'

import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as Secp256k1 from '../../Secp256k1.js'
import type { HdKey } from './types.js'

/** @internal */
export function HdKey_fromScure(key: HDKey): HdKey {
  return {
    derive: (path) => HdKey_fromScure(key.derive(path)),
    depth: key.depth,
    identifier: Hex.fromBytes(key.identifier!),
    index: key.index,
    privateKey: Hex.fromBytes(key.privateKey!),
    privateExtendedKey: key.privateExtendedKey,
    publicKey: Secp256k1.getPublicKey({ privateKey: key.privateKey! }),
    publicExtendedKey: key.publicExtendedKey,
    versions: key.versions,
  }
}

/** @internal */
export declare namespace HdKey_fromScure {
  type ErrorType = Errors.GlobalErrorType
}
