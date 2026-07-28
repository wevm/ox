/** @entrypointCategory Node */

/**
 * Node.js implementations of Ox's supported cryptographic primitives, backed
 * by `node:crypto`.
 *
 * Import this entrypoint only in Node.js. Its static `node:crypto` dependency
 * is intentionally kept outside Ox's runtime-neutral entrypoint.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Hash } from 'ox'
 * import { Engine } from 'ox/node'
 *
 * await Engine.load()
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Engine from './Engine.js'

/**
 * Node.js implementations of Ox's supported Ed25519 primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Ed25519, Engine } from 'ox'
 * import * as NodeEd25519 from 'ox/node/Ed25519'
 *
 * Engine.set(await NodeEd25519.create())
 *
 * Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as Ed25519 from './Ed25519.js'

/**
 * Node.js implementations of Ox's supported hash primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import * as NodeHash from 'ox/node/Hash'
 *
 * Engine.set(await NodeHash.create())
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Hash from './Hash.js'

/**
 * Node.js implementations of Ox's supported keystore primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Keystore } from 'ox'
 * import * as NodeKeystore from 'ox/node/Keystore'
 *
 * Engine.set(await NodeKeystore.create())
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @category Crypto
 */
export * as Keystore from './Keystore.js'

/**
 * Node.js implementation of Ox's BIP-39 seed derivation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Mnemonic } from 'ox'
 * import * as NodeMnemonic from 'ox/node/Mnemonic'
 *
 * Engine.set(await NodeMnemonic.create())
 *
 * Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @category Crypto
 */
export * as Mnemonic from './Mnemonic.js'

/**
 * Node.js implementation of Ox's P256 public-key derivation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, P256 } from 'ox'
 * import * as NodeP256 from 'ox/node/P256'
 *
 * Engine.set(await NodeP256.create())
 *
 * P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as P256 from './P256.js'

/**
 * Node.js implementations of Ox's supported X25519 primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, X25519 } from 'ox'
 * import * as NodeX25519 from 'ox/node/X25519'
 *
 * Engine.set(await NodeX25519.create())
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as X25519 from './X25519.js'
