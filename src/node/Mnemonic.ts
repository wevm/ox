import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

/**
 * Creates a Node.js implementation of the [`Mnemonic.toSeed`](/api/Mnemonic/toSeed)
 * primitive, without installing it.
 *
 * Most callers want {@link ox#Engine.load} instead, which installs every
 * implementation this entrypoint provides. Reach for this to take the
 * `Mnemonic` slot on its own, or to hold the implementation without touching
 * the installed engine.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Mnemonic } from 'ox'
 * import * as NodeMnemonic from 'ox/node/Mnemonic'
 *
 * Engine.set(await NodeMnemonic.create())
 *
 * Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @returns An engine supplying the `Mnemonic` slot.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    Mnemonic: {
      toSeed: (mnemonic, passphrase = '') => {
        if (typeof mnemonic !== 'string')
          throw new TypeError(`invalid mnemonic type: ${typeof mnemonic}`)

        const normalized = mnemonic.normalize('NFKD')
        if (![12, 15, 18, 21, 24].includes(normalized.split(' ').length))
          throw new Error('Invalid mnemonic')

        return copyAndClear(
          crypto.pbkdf2Sync(
            normalized,
            `mnemonic${passphrase}`.normalize('NFKD'),
            2048,
            64,
            'sha512',
          ),
        )
      },
    },
  })
}

export declare namespace create {
  /** The `Mnemonic` slot, carrying every primitive this module implements. */
  type ReturnType = {
    Mnemonic: {
      [key in 'toSeed']-?: NonNullable<Engine.Mnemonic[key]>
    }
  }

  type ErrorType = Errors.GlobalErrorType
}

function copyAndClear(value: Buffer): Uint8Array {
  try {
    return Uint8Array.from(value)
  } finally {
    value.fill(0)
  }
}
