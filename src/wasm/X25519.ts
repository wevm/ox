import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as crypto25519 from './internal/crypto25519.js'
import * as internal from './internal/instantiate.js'
import * as x25519 from './internal/x25519.js'

export { MemoryError } from './internal/instantiate.js'

const keySize = 32

/**
 * Compiles WASM implementations of selected [`X25519`](/api/X25519)
 * primitives, without installing them.
 *
 * Random key generation remains on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import * as WasmX25519 from 'ox/wasm/X25519'
 *
 * Engine.set(await WasmX25519.create())
 * ```
 *
 * @returns An engine supplying part of the `X25519` slot.
 */
export async function create(): Promise<create.ReturnType> {
  const module = await crypto25519.load()

  return {
    X25519: {
      getPublicKey(privateKey) {
        assertLength(privateKey, 'private')
        module.reserve(keySize * 2)
        const privateKeyPtr = module.heapBase
        const publicKeyPtr = privateKeyPtr + keySize
        try {
          module.view().set(privateKey, privateKeyPtr)
          module.exports.x25519_get_public_key(privateKeyPtr, publicKeyPtr)
          return module.view().slice(publicKeyPtr, publicKeyPtr + keySize)
        } finally {
          module.exports.zero(privateKeyPtr, keySize * 2)
        }
      },
      getSharedSecret(privateKey, publicKey) {
        assertLength(privateKey, 'private')
        assertLength(publicKey, 'public')
        return x25519.getSharedSecret(module, privateKey, publicKey)
      },
    },
  }
}

export declare namespace create {
  /** The `X25519` slot, carrying every primitive this module implements. */
  type ReturnType = {
    X25519: {
      [key in 'getPublicKey' | 'getSharedSecret']-?: NonNullable<
        Engine.Ecdh[key]
      >
    }
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}

function assertLength(key: Uint8Array, type: 'private' | 'public'): void {
  if (key.length !== keySize)
    throw new RangeError(
      `X25519 ${type} key must be ${keySize} bytes, got ${key.length}`,
    )
}
