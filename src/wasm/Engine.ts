import * as CoreEngine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as Ed25519 from './Ed25519.js'
import * as Hash from './Hash.js'
import * as Keystore from './Keystore.js'
import * as Mnemonic from './Mnemonic.js'
import * as X25519 from './X25519.js'
import type * as internal from './internal/instantiate.js'

export {
  AsyncScopeError,
  get,
  InvalidSlotValueError,
  reset,
  set,
  UnknownPrimitiveError,
  UnknownSlotError,
  with,
} from '../core/Engine.js'
export type {
  Bls,
  Ecdh,
  Ecdsa,
  Eddsa,
  Engine,
  Hash,
  HdKey,
  HdKeyNode,
  HdKeyVersions,
  Keystore,
  Mnemonic,
} from '../core/Engine.js'

/**
 * Compiles and installs every WASM implementation this entrypoint provides.
 *
 * Slot compilation starts concurrently. Nothing is installed until every slot
 * resolves successfully.
 *
 * Call this once, during startup, before any crypto call. Ox resolves the
 * engine at call time, so values computed beforehand used whatever was
 * installed then.
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
 * @returns The engine that was installed.
 */
export async function install(): Promise<install.ReturnType> {
  return CoreEngine.install({
    Ed25519: Ed25519.engine(),
    Hash: Hash.engine(),
    Keystore: Keystore.engine(),
    Mnemonic: Mnemonic.engine(),
    X25519: X25519.engine(),
  })
}

export declare namespace install {
  type ReturnType = engine.ReturnType

  type ErrorType =
    | engine.ErrorType
    | CoreEngine.install.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Compiles every WASM implementation this entrypoint provides, without
 * installing it.
 *
 * Reach for this where an engine has to exist as a value, such as a benchmark
 * or an [`Engine.with`](/api/Engine/with) scope. Use the individual module's
 * `engine` function to select only some slots.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import { Engine as Wasm } from 'ox/wasm'
 *
 * const wasm = await Wasm.engine()
 *
 * Engine.with(wasm, () => Hash.sha256('0xdeadbeef'))
 * ```
 *
 * @returns An engine, ready to install.
 */
export async function engine(): Promise<engine.ReturnType> {
  const [ed25519, hash, keystore, mnemonic, x25519] = await Promise.all([
    Ed25519.engine(),
    Hash.engine(),
    Keystore.engine(),
    Mnemonic.engine(),
    X25519.engine(),
  ])
  return {
    Ed25519: ed25519,
    Hash: hash,
    Keystore: keystore,
    Mnemonic: mnemonic,
    X25519: x25519,
  }
}

export declare namespace engine {
  /** Every slot this entrypoint supplies, each with its primitives present. */
  type ReturnType = {
    Ed25519: Ed25519.engine.ReturnType
    Hash: Hash.engine.ReturnType
    Keystore: Keystore.engine.ReturnType
    Mnemonic: Mnemonic.engine.ReturnType
    X25519: X25519.engine.ReturnType
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
