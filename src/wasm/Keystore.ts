import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as hashes from './internal/hashes.js'
import * as internal from './internal/instantiate.js'
import * as pbkdf2 from './internal/pbkdf2.js'

export { MemoryError } from './internal/instantiate.js'

/**
 * Compiles the WASM implementation of the [`Keystore`](/api/Keystore) PBKDF2
 * primitive, without installing it.
 *
 * Most callers want {@link ox#Engine.load} instead, which compiles every
 * implementation this entrypoint provides and installs them in one call. This
 * provider deliberately stays synchronous and leaves AES, asynchronous PBKDF2,
 * and scrypt on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Keystore } from 'ox'
 * import * as WasmKeystore from 'ox/wasm/Keystore'
 *
 * Engine.set(await WasmKeystore.create())
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @returns An engine supplying synchronous PBKDF2-HMAC-SHA256.
 */
export async function create(): Promise<create.ReturnType> {
  const module = await hashes.load()
  return {
    Keystore: {
      pbkdf2Sha256: (password, salt, options) =>
        pbkdf2.pbkdf2Sha256(module, password, salt, options),
    },
  }
}

export declare namespace create {
  /** The `Keystore` slot with synchronous PBKDF2-HMAC-SHA256 present. */
  type ReturnType = {
    Keystore: {
      pbkdf2Sha256: NonNullable<Engine.Keystore['pbkdf2Sha256']>
    }
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
