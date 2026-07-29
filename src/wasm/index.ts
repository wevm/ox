/** @entrypointCategory WASM */

/**
 * WASM implementations of Ox's supported cryptographic primitives, compiled
 * from C.
 *
 * Install it during startup. WASM must be compiled asynchronously, so the
 * `await` lives there. Every cryptographic call afterwards is synchronous.
 *
 * :::note
 * Performance varies by primitive, input size, runtime, and processor. Run
 * `pnpm bench:engines` to compare the available implementations on your target
 * machine.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox/wasm'
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
 * WASM implementations of Ox's supported Ed25519 primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Ed25519 } from 'ox/wasm'
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
 * WASM implementations of Ox's supported hash primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Hash } from 'ox/wasm'
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
 * WASM implementations of Ox's synchronous PBKDF2-HMAC-SHA256 and scrypt
 * primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Keystore } from 'ox/wasm'
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
 * WASM implementation of Ox's KZG interface, backed by c-kzg-4844.
 *
 * This module is not installed into [`Engine`](/api/Engine). Create an explicit
 * instance, pass it anywhere that accepts `Kzg.Kzg`, and dispose it when done.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Setups } from 'ox/trusted-setups'
 * import { Kzg } from 'ox/wasm'
 *
 * const kzg = await Kzg.create({ trustedSetup: Setups.mainnet })
 *
 * kzg.dispose()
 * ```
 *
 * @category Crypto
 */
export * as Kzg from './Kzg.js'

/**
 * WASM implementation of Ox's BIP-39 seed derivation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Mnemonic } from 'ox/wasm'
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
 * WASM implementations of Ox's supported X25519 primitives.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { X25519 } from 'ox/wasm'
 *
 * await Engine.install({ X25519: X25519.engine() })
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as X25519 from './X25519.js'
