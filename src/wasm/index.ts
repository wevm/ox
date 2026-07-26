/** @entrypointCategory WASM */

/**
 * WASM implementations of ox's hash primitives, compiled from C.
 *
 * Load it and hand the result to {@link ox#Engine.set}. WASM must be compiled
 * asynchronously, so the `await` lives here -- every call afterwards is
 * synchronous.
 *
 * :::note
 * WASM wins on throughput, not on latency. The call boundary costs roughly as
 * much as hashing a short input, so a 32-byte `keccak256` is no faster than ox's
 * default implementation and may be slower. The gains start at a few hundred
 * bytes and grow from there.
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
