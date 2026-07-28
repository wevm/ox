import * as CoreEngine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as Ed25519 from './Ed25519.js'
import * as Hash from './Hash.js'
import * as Keystore from './Keystore.js'
import * as Mnemonic from './Mnemonic.js'
import * as P256 from './P256.js'
import * as X25519 from './X25519.js'

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
  return {
    ...(await Ed25519.create()),
    ...(await Hash.create()),
    ...(await Keystore.create()),
    ...(await Mnemonic.create()),
    ...(await P256.create()),
    ...(await X25519.create()),
  }
}

export declare namespace create {
  /** Every slot this entrypoint supplies, each with its primitives present. */
  type ReturnType = Ed25519.create.ReturnType &
    Hash.create.ReturnType &
    Keystore.create.ReturnType &
    Mnemonic.create.ReturnType &
    P256.create.ReturnType &
    X25519.create.ReturnType

  type ErrorType =
    | Ed25519.create.ErrorType
    | Hash.create.ErrorType
    | Keystore.create.ErrorType
    | Mnemonic.create.ErrorType
    | P256.create.ErrorType
    | X25519.create.ErrorType
    | Errors.GlobalErrorType
}
