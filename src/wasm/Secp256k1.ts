import type * as Engine from '../core/Engine.js'
import * as Errors from '../core/Errors.js'
import * as internal from './internal/instantiate.js'
import * as secp256k1 from './internal/secp256k1.js'

export * from '../core/Secp256k1.js'
export { MemoryError } from './internal/instantiate.js'

const privateKeySize = 32
const publicKeySize = 65
const sharedSecretSize = 33
const compactSignatureSize = 64
const recoveredSignatureSize = 65
const maxRawMessageSize = 8192

/**
 * Compiles WASM implementations of deterministic
 * [`Secp256k1`](/api/Secp256k1) primitives, without installing them.
 *
 * Random key generation remains on Ox's host-backed default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Secp256k1 } from 'ox/wasm'
 *
 * await Engine.install({ Secp256k1: Secp256k1.engine() })
 *
 * Secp256k1.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The WASM implementation of the deterministic `Secp256k1` primitives.
 */
export async function engine(): Promise<engine.ReturnType> {
  const module = await secp256k1.load()

  return {
    getPublicKey(privateKey) {
      assertLength(privateKey, privateKeySize, 'private key')
      const size = privateKeySize + publicKeySize
      module.reserve(size)
      const privateKeyPtr = module.heapBase
      const publicKeyPtr = privateKeyPtr + privateKeySize
      try {
        module.view().set(privateKey, privateKeyPtr)
        if (
          module.exports.secp256k1_get_public_key(
            privateKeyPtr,
            publicKeyPtr,
          ) !== 1
        )
          throw new InvalidInputError({ operation: 'getPublicKey' })
        return module.view().slice(publicKeyPtr, publicKeyPtr + publicKeySize)
      } finally {
        module.exports.zero(privateKeyPtr, size)
      }
    },
    getSharedSecret(privateKey, publicKey) {
      assertLength(privateKey, privateKeySize, 'private key')
      assertPublicKeyLength(publicKey)
      const size = privateKeySize + publicKey.length + sharedSecretSize
      module.reserve(size)
      const privateKeyPtr = module.heapBase
      const publicKeyPtr = privateKeyPtr + privateKeySize
      const sharedSecretPtr = publicKeyPtr + publicKey.length
      try {
        const memory = module.view()
        memory.set(privateKey, privateKeyPtr)
        memory.set(publicKey, publicKeyPtr)
        if (
          module.exports.secp256k1_get_shared_secret(
            privateKeyPtr,
            publicKeyPtr,
            publicKey.length,
            sharedSecretPtr,
          ) !== 1
        )
          throw new InvalidInputError({ operation: 'getSharedSecret' })
        return module
          .view()
          .slice(sharedSecretPtr, sharedSecretPtr + sharedSecretSize)
      } finally {
        module.exports.zero(privateKeyPtr, size)
      }
    },
    recoverPublicKey(signature, payload) {
      assertLength(signature, recoveredSignatureSize, 'signature')
      assertRawMessageLength(payload)
      const size = recoveredSignatureSize + payload.length + publicKeySize
      module.reserve(size)
      const signaturePtr = module.heapBase
      const payloadPtr = signaturePtr + recoveredSignatureSize
      const publicKeyPtr = payloadPtr + payload.length
      try {
        const memory = module.view()
        memory.set(signature, signaturePtr)
        memory.set(payload, payloadPtr)
        if (
          module.exports.secp256k1_recover_public_key(
            signaturePtr,
            payloadPtr,
            payload.length,
            publicKeyPtr,
          ) !== 1
        )
          throw new InvalidInputError({ operation: 'recoverPublicKey' })
        return module.view().slice(publicKeyPtr, publicKeyPtr + publicKeySize)
      } finally {
        module.exports.zero(signaturePtr, size)
      }
    },
    sign(payload, privateKey, options) {
      assertLength(privateKey, privateKeySize, 'private key')
      if (!options.prehash) assertRawMessageLength(payload)
      const entropy =
        options.extraEntropy === true
          ? crypto.getRandomValues(new Uint8Array(privateKeySize))
          : options.extraEntropy === false
            ? undefined
            : options.extraEntropy
      const entropySize = entropy?.length ?? 0
      const size =
        payload.length + privateKeySize + entropySize + recoveredSignatureSize
      module.reserve(size)
      const payloadPtr = module.heapBase
      const privateKeyPtr = payloadPtr + payload.length
      const entropyPtr = entropy ? privateKeyPtr + privateKeySize : 0
      const signaturePtr = privateKeyPtr + privateKeySize + entropySize
      try {
        const memory = module.view()
        memory.set(payload, payloadPtr)
        memory.set(privateKey, privateKeyPtr)
        if (entropy) memory.set(entropy, entropyPtr)
        if (
          module.exports.secp256k1_sign(
            payloadPtr,
            payload.length,
            privateKeyPtr,
            entropyPtr,
            entropySize,
            Number(options.prehash),
            signaturePtr,
          ) !== 1
        )
          throw new InvalidInputError({ operation: 'sign' })
        return module
          .view()
          .slice(signaturePtr, signaturePtr + recoveredSignatureSize)
      } finally {
        module.exports.zero(payloadPtr, size)
      }
    },
    verify(signature, payload, publicKey, options) {
      assertLength(signature, compactSignatureSize, 'signature')
      assertPublicKeyLength(publicKey)
      if (!options.prehash) assertRawMessageLength(payload)
      const size = compactSignatureSize + payload.length + publicKey.length
      module.reserve(size)
      const signaturePtr = module.heapBase
      const payloadPtr = signaturePtr + compactSignatureSize
      const publicKeyPtr = payloadPtr + payload.length
      try {
        const memory = module.view()
        memory.set(signature, signaturePtr)
        memory.set(payload, payloadPtr)
        memory.set(publicKey, publicKeyPtr)
        return (
          module.exports.secp256k1_verify(
            signaturePtr,
            payloadPtr,
            payload.length,
            publicKeyPtr,
            publicKey.length,
            Number(options.prehash),
          ) === 1
        )
      } finally {
        module.exports.zero(signaturePtr, size)
      }
    },
  }
}

export declare namespace engine {
  /** Every `Secp256k1` primitive this module implements. */
  type ReturnType = {
    [key in
      | 'getPublicKey'
      | 'getSharedSecret'
      | 'recoverPublicKey'
      | 'sign'
      | 'verify']-?: NonNullable<Engine.Ecdsa[key]>
  }

  type ErrorType =
    | InvalidInputError
    | internal.MemoryError
    | Errors.GlobalErrorType
}

function assertLength(value: Uint8Array, length: number, name: string): void {
  if (value.length !== length)
    throw new RangeError(
      `Secp256k1 ${name} must be ${length} bytes, got ${value.length}`,
    )
}

function assertPublicKeyLength(publicKey: Uint8Array): void {
  if (
    publicKey.length !== sharedSecretSize &&
    publicKey.length !== publicKeySize
  )
    throw new RangeError(
      `Secp256k1 public key must be 33 or 65 bytes, got ${publicKey.length}`,
    )
}

function assertRawMessageLength(payload: Uint8Array): void {
  if (payload.length > maxRawMessageSize)
    throw new RangeError(
      `Secp256k1 unhashed payload must not exceed ${maxRawMessageSize} bytes, got ${payload.length}`,
    )
}

/**
 * Thrown when libsecp256k1 rejects a key or recovered signature.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox/wasm'
 *
 * try {
 *   const engine = await Secp256k1.engine()
 *   engine.getPublicKey(new Uint8Array(32))
 * } catch (error) {
 *   if (error instanceof Secp256k1.InvalidInputError)
 *     console.error(error.message)
 * }
 * ```
 */
export class InvalidInputError extends Errors.BaseError {
  override readonly name = 'Secp256k1.InvalidInputError'

  constructor({ operation }: { operation: string }) {
    super(`WASM secp256k1 ${operation} received invalid input.`)
  }
}
