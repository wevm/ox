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
 * import { Engine, Hash } from 'ox/node'
 *
 * await Engine.install()
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Engine from './Engine.js'

/**
 * Ox's Ed25519 API and its supported Node.js engine primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Ed25519 } from 'ox/node'
 *
 * await Engine.install({ Ed25519: Ed25519.engine() })
 *
 * Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as Ed25519 from './Ed25519.js'

/**
 * Ox's hash API and its supported Node.js engine primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Hash } from 'ox/node'
 *
 * await Engine.install({ Hash: Hash.engine() })
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Hash from './Hash.js'

/**
 * Ox's keystore API and its supported Node.js engine primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Keystore } from 'ox/node'
 *
 * await Engine.install({ Keystore: Keystore.engine() })
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @category Crypto
 */
export * as Keystore from './Keystore.js'

/**
 * Ox's mnemonic API and its Node.js BIP-39 seed engine primitive.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Mnemonic } from 'ox/node'
 *
 * await Engine.install({ Mnemonic: Mnemonic.engine() })
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
 * Ox's P256 API and its Node.js public-key derivation engine primitive.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { P256 } from 'ox/node'
 *
 * await Engine.install({ P256: P256.engine() })
 *
 * P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as P256 from './P256.js'

/**
 * Ox's X25519 API and its supported Node.js engine primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { X25519 } from 'ox/node'
 *
 * await Engine.install({ X25519: X25519.engine() })
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as X25519 from './X25519.js'
