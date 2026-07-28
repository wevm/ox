import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

export * from '../core/Mnemonic.js'

/**
 * Creates a Node.js implementation of the [`Mnemonic`](/api/Mnemonic) engine
 * slot, without installing it.
 *
 * Most callers want [`Engine.install`](/node/crypto/Engine/install) instead,
 * which installs every implementation this entrypoint provides. Reach for this
 * to install or hold the `Mnemonic` slot on its own.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Mnemonic } from 'ox/node'
 *
 * await Engine.install({ Mnemonic: Mnemonic.engine() })
 *
 * Mnemonic.toSeed(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @returns The raw `Mnemonic` engine slot.
 */
export function engine(): Promise<engine.ReturnType> {
  return Promise.resolve({
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
  })
}

export declare namespace engine {
  /** Every `Mnemonic` primitive this module implements. */
  type ReturnType = {
    [key in 'toSeed']-?: NonNullable<Engine.Mnemonic[key]>
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
