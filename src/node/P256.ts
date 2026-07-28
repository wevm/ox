import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

/**
 * Creates a Node.js implementation of
 * [`P256.getPublicKey`](/api/P256/getPublicKey), without installing it.
 *
 * Node's other P256 operations do not reproduce Ox's recovered-signature and
 * compressed-shared-point contracts, so they remain on Ox's defaults.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, P256 } from 'ox'
 * import * as NodeP256 from 'ox/node/P256'
 *
 * Engine.set(await NodeP256.create())
 *
 * P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns An engine supplying `P256.getPublicKey`.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    P256: {
      getPublicKey: (privateKey) => {
        if (privateKey.length !== 32)
          throw new RangeError(
            `P256 private key must be 32 bytes, got ${privateKey.length}`,
          )
        const ecdh = crypto.createECDH('prime256v1')
        ecdh.setPrivateKey(privateKey)
        return new Uint8Array(ecdh.getPublicKey(undefined, 'uncompressed'))
      },
    },
  })
}

export declare namespace create {
  /** The `P256` slot, carrying every primitive this module implements. */
  type ReturnType = {
    P256: {
      getPublicKey: NonNullable<Engine.Ecdsa['getPublicKey']>
    }
  }

  type ErrorType = Errors.GlobalErrorType
}
