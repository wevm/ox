import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as internal from './internal/hdKey.js'
import type { HdKeyNode, HdKeyVersions } from './internal/engine.js'
import * as PublicKey from './PublicKey.js'

const defaultVersions = {
  private: 0x0488_ade4,
  public: 0x0488_b21e,
} satisfies Versions

/** BIP-32 version bytes for private and public extended keys. */
export type Versions = HdKeyVersions

/** Root type for a Hierarchical Deterministic (HD) Key. */
export type HdKey = {
  derive: (path: string) => HdKey
  depth: number
  index: number
  identifier: Hex.Hex
  privateKey: Hex.Hex
  privateExtendedKey: string
  publicKey: PublicKey.PublicKey<false>
  publicExtendedKey: string
  versions: Versions
}

/** @internal */
function fromNode(node: HdKeyNode): HdKey {
  assertNodeBytes(node.identifier, 'identifier', 20)
  assertNodeBytes(node.privateKey, 'private key', 32)
  assertNodeBytes(node.publicKey, 'public key', 65)
  const versions = { ...node.versions }
  const sourceVersions = { ...node.versions }
  const privateExtendedKey = node.privateExtendedKey
  return {
    derive: createDerive(privateExtendedKey, versions, sourceVersions),
    depth: node.depth,
    identifier: Hex.fromBytes(node.identifier),
    index: node.index,
    privateKey: Hex.fromBytes(node.privateKey),
    privateExtendedKey,
    publicKey: PublicKey.fromBytes(node.publicKey),
    publicExtendedKey: node.publicExtendedKey,
    versions,
  }
}

/** @internal */
function assertNodeBytes(
  value: Bytes.Bytes,
  name: string,
  expectedLength: number,
): void {
  Bytes.assert(value)
  if (value.length !== expectedLength)
    throw new Errors.BaseError(
      `Expected ${expectedLength} bytes for an HD key ${name}, received ${value.length}.`,
    )
}

/** @internal */
function createDerive(
  privateExtendedKey: string,
  versions: Versions,
  sourceVersions: Versions,
): HdKey['derive'] {
  return (path) =>
    fromNode(
      internal.derive(privateExtendedKey, path, versions, sourceVersions),
    )
}

/**
 * Creates a HD Key from an extended private key.
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const hdKey = HdKey.fromExtendedKey('...')
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param extendedKey - The extended private key.
 * @param options - Creation options.
 * @returns The HD Key.
 */
export function fromExtendedKey(
  extendedKey: string,
  options: fromExtendedKey.Options = {},
): HdKey {
  const versions = { ...(options.versions ?? defaultVersions) }
  return fromNode(internal.fromExtendedKey(extendedKey, versions))
}

export declare namespace fromExtendedKey {
  type Options = {
    /** The versions to use for the HD Key. */
    versions?: Versions | undefined
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | PublicKey.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Creates a HD Key from a JSON object containing an extended private key (`xpriv`).
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const hdKey = HdKey.fromJson({ xpriv: '...' })
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param json - The JSON object containing an extended private key (`xpriv`).
 * @param options - Creation options.
 * @returns The HD Key.
 */
export function fromJson(
  json: { xpriv: string },
  options: fromJson.Options = {},
): HdKey {
  return fromExtendedKey(json.xpriv, options)
}

export declare namespace fromJson {
  type Options = fromExtendedKey.Options

  type ErrorType = fromExtendedKey.ErrorType | Errors.GlobalErrorType
}

/**
 * Creates a HD Key from a master seed.
 *
 * @example
 * ```ts twoslash
 * import { HdKey, Mnemonic } from 'ox'
 *
 * const seed = Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * const hdKey = HdKey.fromSeed(seed)
 * ```
 *
 * @example
 * ### Path Derivation
 *
 * You can derive a HD Key at a specific path using `derive`.
 *
 * ```ts twoslash
 * import { HdKey, Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * const hdKey = HdKey.fromSeed(mnemonic).derive(HdKey.path())
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param seed - The master seed to create the HD Key from.
 * @param options - Creation options.
 * @returns The HD Key.
 */
export function fromSeed(
  seed: Hex.Hex | Bytes.Bytes,
  options: fromSeed.Options = {},
): HdKey {
  const versions = { ...(options.versions ?? defaultVersions) }
  return fromNode(internal.fromSeed(Bytes.from(seed), versions))
}

export declare namespace fromSeed {
  type Options = {
    /** The versions to use for the HD Key. */
    versions?: Versions | undefined
  }

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | PublicKey.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Creates an Ethereum-based BIP-44 HD path.
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const path = HdKey.path({ account: 1, index: 2 })
 * // @log: "m/44'/60'/1'/0/2"
 * ```
 *
 * @param options - Path options.
 * @returns The path.
 */
export function path(options: path.Options = {}): string {
  const { account = 0, change = 0, index = 0 } = options
  return `m/44'/60'/${account}'/${change}/${index}`
}

export declare namespace path {
  type Options = {
    /**
     * The account.
     * @default 0
     */
    account?: number | undefined
    /**
     * The change.
     * @default 0
     */
    change?: number | undefined
    /**
     * The address index.
     * @default 0
     */
    index?: number | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}
