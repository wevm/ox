import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

export * from '../core/Hash.js'

/**
 * Creates a Node.js implementation of the [`Hash`](/api/Hash) engine slot,
 * without installing it.
 *
 * Most callers want [`Engine.install`](/node/crypto/Engine/install) instead,
 * which installs every implementation this entrypoint provides. Reach for this
 * to install or hold the `Hash` slot on its own.
 *
 * Node's `sha3-256` is not Ethereum Keccak256, so this engine deliberately
 * omits `keccak256`. Any earlier override remains installed; otherwise Ox uses
 * its default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Hash } from 'ox/node'
 *
 * await Engine.install({ Hash: Hash.engine() })
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @returns The raw `Hash` engine slot.
 */
export function engine(): Promise<engine.ReturnType> {
  return Promise.resolve({
    hmacSha256: (key, message) =>
      new Uint8Array(crypto.createHmac('sha256', key).update(message).digest()),
    ripemd160: (input) =>
      new Uint8Array(crypto.hash('ripemd160', input, 'buffer')),
    sha256: (input) => new Uint8Array(crypto.hash('sha256', input, 'buffer')),
  })
}

export declare namespace engine {
  /** Every `Hash` primitive this module implements. */
  type ReturnType = {
    [key in 'hmacSha256' | 'ripemd160' | 'sha256']-?: NonNullable<
      Engine.Hash[key]
    >
  }

  type ErrorType = Errors.GlobalErrorType
}
