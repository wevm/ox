/** @entrypointCategory WASM */

/**
 * WASM implementations of ox's hash primitives, compiled from C.
 *
 * Load it and hand the result to {@link ox#Engine.set}. WASM must be compiled
 * asynchronously, so the `await` lives here -- every call afterwards is
 * synchronous.
 *
 * :::note
 * Measured with `pnpm bench` against `@noble/hashes` 2.2.0, `keccak256` is
 * ~12-14x faster at every input size and `sha256` is ~1.1-3x faster. Numbers
 * vary by runtime -- re-measure on yours.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash as OxHash } from 'ox'
 * import { Hash } from 'ox/wasm'
 *
 * Engine.set(await Hash.load())
 *
 * OxHash.keccak256('0xdeadbeef')
 * ```
 *
 * @category Crypto
 */
export * as Hash from './Hash.js'
