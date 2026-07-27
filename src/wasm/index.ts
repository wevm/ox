/** @entrypointCategory WASM */

/**
 * WASM implementations of ox's hash primitives, compiled from C.
 *
 * Load it and hand the result to {@link ox#Engine.set}. WASM must be compiled
 * asynchronously, so the `await` lives here -- every call afterwards is
 * synchronous.
 *
 * :::note
 * Performance varies by primitive, input size, runtime, and processor. Run
 * `pnpm bench:hash` to compare the available implementations on your target
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
