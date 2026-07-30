import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as CoreHash from '../core/Hash.js'

export * from '../core/Hash.js'

/**
 * Creates a Node.js implementation of the [`Hash`](/api/Hash) engine slot,
 * without installing it.
 *
 * Most callers want [`Engine.install`](/node/crypto/Engine/install) instead,
 * which installs every implementation this entrypoint provides. Reach for this
 * to install or hold the `Hash` slot on its own.
 *
 * Node does not provide BLAKE3, and its `sha3-256` is not Ethereum Keccak256.
 * Node HMAC states cannot be cloned.
 *
 * The engine omits those implementations. Earlier overrides remain installed;
 * Ox uses its defaults when no override exists.
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
    createRipemd160: () => fromHash(crypto.createHash('ripemd160'), 20),
    createSha256: () => fromHash(crypto.createHash('sha256'), 32),
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
    [key in
      | 'createRipemd160'
      | 'createSha256'
      | 'hmacSha256'
      | 'ripemd160'
      | 'sha256']-?: NonNullable<Engine.Hash[key]>
  }

  type ErrorType = Errors.GlobalErrorType
}

function fromHash(initial: crypto.Hash, digestSize: number): Engine.HashState {
  let hash: crypto.Hash | undefined = initial

  const get = () => {
    if (!hash) throw new CoreHash.HasherDestroyedError()
    return hash
  }

  return {
    clone: () => fromHash(get().copy(), digestSize),
    destroy: () => {
      hash = undefined
    },
    digestInto: (output) => {
      const active = get()
      if (output.length < digestSize)
        throw new CoreHash.InvalidDigestSizeError({
          minimum: digestSize,
          size: output.length,
        })
      hash = undefined
      output.set(active.digest())
    },
    update: (input) => {
      get().update(input)
    },
  }
}
