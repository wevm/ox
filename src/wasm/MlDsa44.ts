import type * as Engine from '../core/Engine.js'
import * as Errors from '../core/Errors.js'
import * as internal from './internal/instantiate.js'
import * as mldsa44 from './internal/mldsa44.js'

export * from '../core/MlDsa44.js'
export { MemoryError } from './internal/instantiate.js'

const privateKeySize = 32
const publicKeySize = 1312
const signatureSize = 2420
const randomSize = 32
const maxContextSize = 255

/**
 * Compiles WASM implementations of selected [`MlDsa44`](/api/MlDsa44)
 * primitives, without installing them.
 *
 * Random key generation remains on Ox's host-backed default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { MlDsa44 } from 'ox/wasm'
 *
 * await Engine.install({ MlDsa44: MlDsa44.engine() })
 *
 * MlDsa44.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The WASM implementation of part of the `MlDsa44` slot.
 */
export async function engine(): Promise<engine.ReturnType> {
  const module = await mldsa44.load()

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
          module.exports.mldsa44_get_public_key(privateKeyPtr, publicKeyPtr) !==
          1
        )
          throw new InvalidInputError({ operation: 'getPublicKey' })
        return module.view().slice(publicKeyPtr, publicKeyPtr + publicKeySize)
      } finally {
        module.exports.zero(privateKeyPtr, size)
      }
    },
    sign(payload, privateKey, options) {
      assertLength(privateKey, privateKeySize, 'private key')
      const context = options.context ?? new Uint8Array(0)
      assertContextLength(context)
      // FIPS 204 hedged signing draws 32 bytes of randomness; the
      // deterministic variant pins them to zero.
      const random =
        options.extraEntropy === true
          ? crypto.getRandomValues(new Uint8Array(randomSize))
          : options.extraEntropy === false
            ? new Uint8Array(randomSize)
            : options.extraEntropy
      assertLength(random, randomSize, 'extra entropy')
      const size =
        privateKeySize +
        randomSize +
        context.length +
        payload.length +
        signatureSize
      module.reserve(size)
      const privateKeyPtr = module.heapBase
      const randomPtr = privateKeyPtr + privateKeySize
      const contextPtr = randomPtr + randomSize
      const payloadPtr = contextPtr + context.length
      const signaturePtr = payloadPtr + payload.length
      try {
        const memory = module.view()
        memory.set(privateKey, privateKeyPtr)
        memory.set(random, randomPtr)
        memory.set(context, contextPtr)
        memory.set(payload, payloadPtr)
        if (
          module.exports.mldsa44_sign(
            privateKeyPtr,
            payloadPtr,
            payload.length,
            contextPtr,
            context.length,
            randomPtr,
            signaturePtr,
          ) !== 1
        )
          throw new InvalidInputError({ operation: 'sign' })
        return module.view().slice(signaturePtr, signaturePtr + signatureSize)
      } finally {
        module.exports.zero(privateKeyPtr, size)
      }
    },
    verify(signature, payload, publicKey, options) {
      assertLength(publicKey, publicKeySize, 'public key')
      const context = options.context ?? new Uint8Array(0)
      assertContextLength(context)
      // A malformed signature is a verification failure, not an error.
      if (signature.length !== signatureSize) return false
      const size =
        signatureSize + context.length + payload.length + publicKeySize
      module.reserve(size)
      const signaturePtr = module.heapBase
      const contextPtr = signaturePtr + signatureSize
      const payloadPtr = contextPtr + context.length
      const publicKeyPtr = payloadPtr + payload.length
      try {
        const memory = module.view()
        memory.set(signature, signaturePtr)
        memory.set(context, contextPtr)
        memory.set(payload, payloadPtr)
        memory.set(publicKey, publicKeyPtr)
        return (
          module.exports.mldsa44_verify(
            signaturePtr,
            payloadPtr,
            payload.length,
            contextPtr,
            context.length,
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
  /** Every `MlDsa44` primitive this module implements. */
  type ReturnType = {
    [key in 'getPublicKey' | 'sign' | 'verify']-?: NonNullable<
      Engine.MlDsa[key]
    >
  }

  type ErrorType =
    | InvalidInputError
    | internal.MemoryError
    | Errors.GlobalErrorType
}

function assertLength(value: Uint8Array, length: number, name: string): void {
  if (value.length !== length)
    throw new RangeError(
      `ML-DSA-44 ${name} must be ${length} bytes, got ${value.length}`,
    )
}

function assertContextLength(context: Uint8Array): void {
  if (context.length > maxContextSize)
    throw new RangeError(
      `ML-DSA-44 context must be at most ${maxContextSize} bytes, got ${context.length}`,
    )
}

/**
 * Thrown when mldsa-native rejects an input or fails to produce a signature.
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox/wasm'
 *
 * try {
 *   const engine = await MlDsa44.engine()
 *   engine.getPublicKey(new Uint8Array(32))
 * } catch (error) {
 *   if (error instanceof MlDsa44.InvalidInputError)
 *     console.error(error.message)
 * }
 * ```
 */
export class InvalidInputError extends Errors.BaseError {
  override readonly name = 'MlDsa44.InvalidInputError'

  constructor({ operation }: { operation: string }) {
    super(`WASM ML-DSA-44 ${operation} received invalid input.`)
  }
}
