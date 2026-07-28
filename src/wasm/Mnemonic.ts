import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as crypto25519 from './internal/crypto25519.js'
import * as internal from './internal/instantiate.js'
import * as mnemonic from './internal/mnemonic.js'

export { MemoryError } from './internal/instantiate.js'

/**
 * Compiles the WASM implementation of [`Mnemonic.toSeed`](/api/Mnemonic/toSeed),
 * without installing it.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import * as WasmMnemonic from 'ox/wasm/Mnemonic'
 *
 * Engine.set(await WasmMnemonic.create())
 * ```
 *
 * @returns An engine supplying the `Mnemonic` slot.
 */
export async function create(): Promise<create.ReturnType> {
  const module = await crypto25519.load()

  return {
    Mnemonic: {
      toSeed: (value, passphrase) => mnemonic.toSeed(module, value, passphrase),
    },
  }
}

export declare namespace create {
  /** The `Mnemonic` slot, carrying every primitive this module implements. */
  type ReturnType = {
    Mnemonic: {
      toSeed: NonNullable<Engine.Mnemonic['toSeed']>
    }
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
