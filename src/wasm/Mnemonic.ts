import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as crypto25519 from './internal/crypto25519.js'
import * as internal from './internal/instantiate.js'
import * as mnemonic from './internal/mnemonic.js'

export * from '../core/Mnemonic.js'
export { MemoryError } from './internal/instantiate.js'

/**
 * Compiles the WASM implementation of [`Mnemonic.toSeed`](/api/Mnemonic/toSeed),
 * without installing it.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Mnemonic } from 'ox/wasm'
 *
 * await Engine.install({ Mnemonic: Mnemonic.engine() })
 *
 * Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @returns The WASM implementation of the `Mnemonic` slot.
 */
export async function engine(): Promise<engine.ReturnType> {
  const module = await crypto25519.load()

  return {
    toSeed: (value, passphrase) => mnemonic.toSeed(module, value, passphrase),
  }
}

export declare namespace engine {
  /** Every `Mnemonic` primitive this module implements. */
  type ReturnType = {
    toSeed: NonNullable<Engine.Mnemonic['toSeed']>
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
