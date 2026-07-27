import * as CoreEngine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from './Hash.js'

/**
 * Creates and installs every Node.js implementation this entrypoint provides.
 *
 * The function is asynchronous to match the `ox/wasm` entrypoint, even though
 * Node's built-in cryptography needs no compilation. Call it once during
 * startup, before any cryptographic operation.
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
 * @returns The engine that was installed.
 */
export async function load(): Promise<load.ReturnType> {
  const engine = await create()
  CoreEngine.set(engine)
  return engine
}

export declare namespace load {
  type ReturnType = create.ReturnType

  type ErrorType =
    | create.ErrorType
    | CoreEngine.set.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Creates every Node.js implementation this entrypoint provides, without
 * installing it.
 *
 * Reach for this where an engine has to exist as a value, such as a benchmark
 * or an [`Engine.with`](/api/Engine/with) scope.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import { Engine as NodeEngine } from 'ox/node'
 *
 * const node = await NodeEngine.create()
 *
 * Engine.with(node, () => Hash.sha256('0xdeadbeef'))
 * ```
 *
 * @returns An engine, ready to install.
 */
export async function create(): Promise<create.ReturnType> {
  return { ...(await Hash.create()) }
}

export declare namespace create {
  /** Every slot this entrypoint supplies, each with its primitives present. */
  type ReturnType = Hash.create.ReturnType

  type ErrorType = Hash.create.ErrorType | Errors.GlobalErrorType
}
