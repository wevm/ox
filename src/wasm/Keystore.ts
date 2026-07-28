import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as hashes from './internal/hashes.js'
import * as internal from './internal/instantiate.js'
import * as pbkdf2 from './internal/pbkdf2.js'

export * from '../core/Keystore.js'
export { MemoryError } from './internal/instantiate.js'

/**
 * Compiles the WASM implementation of the [`Keystore`](/api/Keystore) PBKDF2
 * primitive, without installing it.
 *
 * Most callers want
 * [`Engine.install`](/wasm/crypto/Engine/install) instead, which compiles every
 * implementation this entrypoint provides and installs them in one call. This
 * provider deliberately stays synchronous and leaves AES, asynchronous PBKDF2,
 * and scrypt on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Keystore } from 'ox/wasm'
 *
 * await Engine.install({ Keystore: Keystore.engine() })
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @returns The WASM implementation of synchronous PBKDF2-HMAC-SHA256.
 */
export async function engine(): Promise<engine.ReturnType> {
  const module = await hashes.load()
  return {
    pbkdf2Sha256: (password, salt, options) =>
      pbkdf2.pbkdf2Sha256(module, password, salt, options),
  }
}

export declare namespace engine {
  /** The WASM `Keystore` primitives this module implements. */
  type ReturnType = {
    pbkdf2Sha256: NonNullable<Engine.Keystore['pbkdf2Sha256']>
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
