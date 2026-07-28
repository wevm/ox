/** @entrypointCategory Node */

/**
 * Node.js implementations of Ox's hash primitives, backed by `node:crypto`.
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
