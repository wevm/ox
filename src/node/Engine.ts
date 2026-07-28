import * as CoreEngine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as Ed25519 from './Ed25519.js'
import * as Hash from './Hash.js'
import * as Keystore from './Keystore.js'
import * as Mnemonic from './Mnemonic.js'
import * as P256 from './P256.js'
import * as X25519 from './X25519.js'

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
  Keystore,
  Mnemonic,
} from '../core/Engine.js'

/**
 * Installs every Node.js implementation this entrypoint provides.
 *
 * Slots initialize in parallel and are installed atomically. Call this once
 * during startup, before any cryptographic operation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox/node'
 *
 * await Engine.install()
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @returns The engine that was installed.
 */
export function install(): Promise<install.ReturnType> {
  return CoreEngine.install({
    Ed25519: Ed25519.engine(),
    Hash: Hash.engine(),
    Keystore: Keystore.engine(),
    Mnemonic: Mnemonic.engine(),
    P256: P256.engine(),
    X25519: X25519.engine(),
  })
}

export declare namespace install {
  /** Every slot this entrypoint installs, each with its primitives present. */
  type ReturnType = engine.ReturnType

  type ErrorType = engine.ErrorType | CoreEngine.install.ErrorType
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
 * const node = await NodeEngine.engine()
 *
 * Engine.with(node, () => Hash.sha256('0xdeadbeef'))
 * ```
 *
 * @returns An engine, ready to install.
 */
export async function engine(): Promise<engine.ReturnType> {
  const [ed25519, hash, keystore, mnemonic, p256, x25519] = await Promise.all([
    Ed25519.engine(),
    Hash.engine(),
    Keystore.engine(),
    Mnemonic.engine(),
    P256.engine(),
    X25519.engine(),
  ])
  return {
    Ed25519: ed25519,
    Hash: hash,
    Keystore: keystore,
    Mnemonic: mnemonic,
    P256: p256,
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
    P256: P256.engine.ReturnType
    X25519: X25519.engine.ReturnType
  }

  type ErrorType =
    | Ed25519.engine.ErrorType
    | Hash.engine.ErrorType
    | Keystore.engine.ErrorType
    | Mnemonic.engine.ErrorType
    | P256.engine.ErrorType
    | X25519.engine.ErrorType
    | Errors.GlobalErrorType
}
