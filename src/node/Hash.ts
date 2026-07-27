import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

/**
 * Creates Node.js implementations of the [`Hash`](/api/Hash) primitives, without
 * installing them.
 *
 * Most callers want {@link ox#Engine.load} instead, which installs every
 * implementation this entrypoint provides. Reach for this to take the `Hash`
 * slot on its own, or to hold the implementation without touching the
 * installed engine.
 *
 * Node's `sha3-256` is not Ethereum Keccak256, so this engine deliberately
 * omits `keccak256`. Any earlier override remains installed; otherwise Ox uses
 * its default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import * as NodeHash from 'ox/node/Hash'
 *
 * Engine.set(await NodeHash.create())
 *
 * Hash.sha256('0xdeadbeef')
 * ```
 *
 * @returns An engine supplying the `Hash` slot.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    Hash: {
      hmacSha256: (key, message) =>
        new Uint8Array(
          crypto.createHmac('sha256', key).update(message).digest(),
        ),
      ripemd160: (input) =>
        new Uint8Array(crypto.hash('ripemd160', input, 'buffer')),
      sha256: (input) => new Uint8Array(crypto.hash('sha256', input, 'buffer')),
    },
  })
}

export declare namespace create {
  /** The `Hash` slot, carrying every primitive this module implements. */
  type ReturnType = {
    Hash: {
      [key in 'hmacSha256' | 'ripemd160' | 'sha256']-?: NonNullable<
        Engine.Hash[key]
      >
    }
  }

  type ErrorType = Errors.GlobalErrorType
}
