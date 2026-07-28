import { HDKey as ScureHdKey } from '@scure/bip32'
import * as Hex from '../Hex.js'
import {
  type Complete,
  type HdKey,
  type HdKeyNode,
  type HdKeyVersions,
  overrides,
} from './engine.js'
import * as secp256k1 from './secp256k1.js'

type Derive = (
  privateExtendedKey: string,
  path: string,
  versions: HdKeyVersions,
  sourceVersions: HdKeyVersions,
) => HdKeyNode

/**
 * Resolvers for the `HdKey` slot, and ox's defaults for it, backed by
 * `@scure/bip32`.
 *
 * The default materializes each provider node before it crosses the engine
 * boundary. No `@scure/bip32` class instance survives the call.
 */

/** @internal */
export function fromScure(key: ScureHdKey): HdKeyNode {
  const privateKey = key.privateKey
  if (!privateKey) {
    // Preserve the previous xpub rejection from public materialization.
    Hex.fromBytes(privateKey!)
    throw new Error('No private key')
  }
  return {
    depth: key.depth,
    identifier: Uint8Array.from(key.identifier!),
    index: key.index,
    privateKey: Uint8Array.from(privateKey),
    privateExtendedKey: key.privateExtendedKey,
    publicKey: secp256k1.getPublicKey(privateKey),
    publicExtendedKey: key.publicExtendedKey,
    versions: { ...key.versions },
  }
}

const deriveDefault: Derive = (
  privateExtendedKey,
  path,
  versions,
  sourceVersions,
) => {
  const key = ScureHdKey.fromExtendedKey(privateExtendedKey, sourceVersions)
  Object.assign(key.versions, versions)
  return fromScure(key.derive(path))
}

const fromExtendedKeyDefault: Complete<HdKey>['fromExtendedKey'] = (
  extendedKey,
  versions,
) => fromScure(ScureHdKey.fromExtendedKey(extendedKey, versions))

const fromSeedDefault: Complete<HdKey>['fromSeed'] = (seed, versions) =>
  fromScure(ScureHdKey.fromMasterSeed(seed, versions))

/** @internal */
export const derive: Derive = (
  privateExtendedKey,
  path,
  versions,
  sourceVersions,
) => {
  const override = overrides.HdKey?.derive
  if (override) return override(privateExtendedKey, path, versions)
  return deriveDefault(privateExtendedKey, path, versions, sourceVersions)
}

/** @internal */
export const fromExtendedKey: Complete<HdKey>['fromExtendedKey'] = (
  extendedKey,
  versions,
) =>
  (overrides.HdKey?.fromExtendedKey ?? fromExtendedKeyDefault)(
    extendedKey,
    versions,
  )

/** @internal */
export const fromSeed: Complete<HdKey>['fromSeed'] = (seed, versions) =>
  (overrides.HdKey?.fromSeed ?? fromSeedDefault)(seed, versions)
