import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as internal from './internal/instantiate.js'
import * as keystore from './internal/keystore.js'
import * as scrypt from './internal/scrypt.js'

export * from '../core/Keystore.js'
export { MemoryError } from './internal/instantiate.js'

/**
 * Compiles the WASM implementations of the [`Keystore`](/api/Keystore)
 * synchronous key-derivation primitives, without installing them.
 *
 * Most callers can use [`Engine.install`](/wasm/crypto/Engine/install).
 * Install this factory explicitly when an application has benchmarked and
 * selected WASM scrypt.
 *
 * This provider stays synchronous and leaves AES and asynchronous key
 * derivation on Ox's default implementation.
 *
 * Scrypt uses a standalone artifact and grows memory only when called.
 * WebAssembly cannot shrink that capacity. The provider clears its contents
 * and enforces Noble's 1 GiB temporary-workspace limit.
 *
 * The aggregate [`Engine.install`](/wasm/crypto/Engine/install) installs only
 * PBKDF2 from this provider. Install this factory explicitly to opt into
 * scrypt, whose relative performance depends on its parameters and runtime.
 *
 * Copied inputs, derived output, and the complete workspace are cleared after
 * every return or trap.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Keystore } from 'ox/wasm'
 *
 * await Engine.install({ Keystore: Keystore.engine() })
 *
 * Keystore.scrypt({ password: 'testpassword' })
 * ```
 *
 * @returns The WASM implementations of synchronous PBKDF2-HMAC-SHA256 and
 * scrypt.
 */
export async function engine(): Promise<engine.ReturnType> {
  const [keystoreEngine, scryptModule] = await Promise.all([
    keystore.engine(),
    scrypt.load(),
  ])
  return {
    ...keystoreEngine,
    scrypt: (password, salt, options) =>
      scrypt.derive(scryptModule, password, salt, options),
  }
}

export declare namespace engine {
  /** The WASM `Keystore` primitives this module implements. */
  type ReturnType = {
    pbkdf2Sha256: NonNullable<Engine.Keystore['pbkdf2Sha256']>
    scrypt: NonNullable<Engine.Keystore['scrypt']>
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
