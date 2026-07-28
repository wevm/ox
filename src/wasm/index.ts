/** @entrypointCategory WASM */

/**
 * WASM implementations of Ox's supported cryptographic primitives, compiled
 * from C.
 *
 * Load it and hand the result to {@link ox#Engine.set}. WASM must be compiled
 * asynchronously, so the `await` lives here -- every call afterwards is
 * synchronous.
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
 * import { Hash } from 'ox'
 * import { Engine } from 'ox/wasm'
 *
 * await Engine.load()
 *
 * Hash.keccak256('0xdeadbeef')
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
 * import { Ed25519, Engine } from 'ox'
 * import * as WasmEd25519 from 'ox/wasm/Ed25519'
 *
 * Engine.set(await WasmEd25519.create())
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
 * import { Engine, Hash } from 'ox'
 * import * as WasmHash from 'ox/wasm/Hash'
 *
 * Engine.set(await WasmHash.create())
 *
 * Hash.keccak256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Hash from './Hash.js'

/**
 * WASM implementation of Ox's synchronous PBKDF2-HMAC-SHA256 primitive.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Keystore } from 'ox'
 * import * as WasmKeystore from 'ox/wasm/Keystore'
 *
 * Engine.set(await WasmKeystore.create())
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @category Crypto
 */
export * as Keystore from './Keystore.js'

/**
 * WASM implementation of Ox's BIP-39 seed derivation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Mnemonic } from 'ox'
 * import * as WasmMnemonic from 'ox/wasm/Mnemonic'
 *
 * Engine.set(await WasmMnemonic.create())
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
 * import { Engine, X25519 } from 'ox'
 * import * as WasmX25519 from 'ox/wasm/X25519'
 *
 * Engine.set(await WasmX25519.create())
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @category Crypto
 */
export * as X25519 from './X25519.js'
