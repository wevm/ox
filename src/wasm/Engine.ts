import * as CoreEngine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from './Hash.js'
import type * as internal from './internal/instantiate.js'

/**
 * Compiles every implementation this entrypoint provides and installs it.
 *
 * WASM must be compiled asynchronously, so this is where the `await` lives.
 * Everything afterwards, including the hashing itself, is synchronous.
 *
 * Call it once, during startup, before any crypto call. ox resolves the engine
 * at call time, so values computed beforehand used whatever was installed then.
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
 * @returns The engine that was installed.
 */
export async function load(): Promise<CoreEngine.Engine> {
  const engine = await create()
  CoreEngine.set(engine)
  return engine
}

export declare namespace load {
  type ErrorType =
    | create.ErrorType
    | CoreEngine.set.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Compiles every implementation this entrypoint provides, without installing
 * it.
 *
 * Use this to measure one implementation against another, or to compose an
 * engine before installing it in one go:
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Engine as Wasm } from 'ox/wasm'
 *
 * Engine.set({ ...(await Wasm.create()), Secp256k1: mySecp256k1 })
 * ```
 *
 * @returns An engine, ready to install.
 */
export async function create(): Promise<CoreEngine.Engine> {
  return { ...(await Hash.create()) }
}

export declare namespace create {
  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
