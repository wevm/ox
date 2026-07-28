import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

export * from '../core/P256.js'

/**
 * Creates a Node.js implementation of the [`P256`](/api/P256) engine slot,
 * without installing it.
 *
 * Node's other P256 operations do not reproduce Ox's recovered-signature and
 * compressed-shared-point contracts, so they remain on Ox's defaults.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { P256 } from 'ox/node'
 *
 * await Engine.install({ P256: P256.engine() })
 *
 * P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The raw `P256` engine slot.
 */
export function engine(): Promise<engine.ReturnType> {
  return Promise.resolve({
    getPublicKey: (privateKey) => {
      if (privateKey.length !== 32)
        throw new RangeError(
          `P256 private key must be 32 bytes, got ${privateKey.length}`,
        )
      const ecdh = crypto.createECDH('prime256v1')
      ecdh.setPrivateKey(privateKey)
      return new Uint8Array(ecdh.getPublicKey(undefined, 'uncompressed'))
    },
  })
}

export declare namespace engine {
  /** Every `P256` primitive this module implements. */
  type ReturnType = {
    getPublicKey: NonNullable<Engine.Ecdsa['getPublicKey']>
  }

  type ErrorType = Errors.GlobalErrorType
}
