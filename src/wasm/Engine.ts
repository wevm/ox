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
 * Compiles every implementation this entrypoint provides, without installing
 * it.
 *
 * Reach for this where an engine has to exist as a value: measuring one
 * implementation against another, or installing for the duration of a call.
 * Combining engines does not need it, because {@link ox#Engine.set} merges --
 * `await load()` followed by `Engine.set({ Secp256k1 })` leaves both in place.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import { Engine as Wasm } from 'ox/wasm'
 *
 * const wasm = await Wasm.create()
 *
 * Engine.with(wasm, () => Hash.keccak256('0xdeadbeef'))
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

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
