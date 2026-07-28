import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as crypto25519 from './internal/crypto25519.js'
import * as ed25519 from './internal/ed25519.js'
import * as internal from './internal/instantiate.js'

export * from '../core/Ed25519.js'
export { MemoryError } from './internal/instantiate.js'

const keySize = 32
const signatureSize = 64

/**
 * Compiles WASM implementations of selected [`Ed25519`](/api/Ed25519)
 * primitives, without installing them.
 *
 * Public-key conversion and random key generation remain on Ox's default
 * implementation. The public conversion is omitted because Monocypher does not
 * reproduce Ox's invalid-point validation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Ed25519 } from 'ox/wasm'
 *
 * await Engine.install({ Ed25519: Ed25519.engine() })
 *
 * Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The WASM implementation of part of the `Ed25519` slot.
 */
export async function engine(): Promise<engine.ReturnType> {
  const module = await crypto25519.load()

  return {
    getPublicKey(privateKey) {
      assertLength(privateKey, keySize, 'private key')
      module.reserve(keySize * 2)
      const privateKeyPtr = module.heapBase
      const publicKeyPtr = privateKeyPtr + keySize
      try {
        module.view().set(privateKey, privateKeyPtr)
        module.exports.ed25519_get_public_key(privateKeyPtr, publicKeyPtr)
        return module.view().slice(publicKeyPtr, publicKeyPtr + keySize)
      } finally {
        module.exports.zero(privateKeyPtr, keySize * 2)
      }
    },
    sign(payload, privateKey) {
      assertLength(privateKey, keySize, 'private key')
      return ed25519.sign(module, payload, privateKey)
    },
    toMontgomerySecret(privateKey) {
      assertLength(privateKey, keySize, 'private key')
      module.reserve(keySize * 2)
      const privateKeyPtr = module.heapBase
      const secretKeyPtr = privateKeyPtr + keySize
      try {
        module.view().set(privateKey, privateKeyPtr)
        module.exports.ed25519_to_montgomery_secret(privateKeyPtr, secretKeyPtr)
        return module.view().slice(secretKeyPtr, secretKeyPtr + keySize)
      } finally {
        module.exports.zero(privateKeyPtr, keySize * 2)
      }
    },
    verify(signature, payload, publicKey) {
      assertLength(signature, signatureSize, 'signature')
      assertLength(publicKey, keySize, 'public key')
      const size = signatureSize + payload.length + keySize
      module.reserve(size)
      const signaturePtr = module.heapBase
      const payloadPtr = signaturePtr + signatureSize
      const publicKeyPtr = payloadPtr + payload.length
      try {
        const memory = module.view()
        memory.set(signature, signaturePtr)
        memory.set(payload, payloadPtr)
        memory.set(publicKey, publicKeyPtr)
        return (
          module.exports.ed25519_verify(
            signaturePtr,
            payloadPtr,
            payload.length,
            publicKeyPtr,
          ) === 1
        )
      } finally {
        module.exports.zero(signaturePtr, size)
      }
    },
  }
}

export declare namespace engine {
  /** Every `Ed25519` primitive this module implements. */
  type ReturnType = {
    [key in
      | 'getPublicKey'
      | 'sign'
      | 'toMontgomerySecret'
      | 'verify']-?: NonNullable<Engine.Eddsa[key]>
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}

function assertLength(value: Uint8Array, length: number, name: string): void {
  if (value.length !== length)
    throw new RangeError(
      `Ed25519 ${name} must be ${length} bytes, got ${value.length}`,
    )
}
