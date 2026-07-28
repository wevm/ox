import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

export * from '../core/Ed25519.js'

const privateKeyPrefix = Buffer.from('302e020100300506032b657004220420', 'hex')

/**
 * Creates a Node.js implementation of the [`Ed25519`](/api/Ed25519) engine
 * slot, without installing it.
 *
 * Node's verifier does not implement Ox's ZIP-215 verification semantics, so
 * this engine deliberately omits `verify`. Public-key conversion and random
 * key generation also remain on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Ed25519 } from 'ox/node'
 *
 * await Engine.install({ Ed25519: Ed25519.engine() })
 *
 * Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The raw `Ed25519` engine slot.
 */
export function engine(): Promise<engine.ReturnType> {
  return Promise.resolve({
    getPublicKey: (privateKey) =>
      rawPublicKey(crypto.createPublicKey(toPrivateKey(privateKey))),
    sign: (payload, privateKey) =>
      new Uint8Array(crypto.sign(null, payload, toPrivateKey(privateKey))),
    toMontgomerySecret: (privateKey) => {
      assertLength(privateKey)
      const digest = crypto.hash('sha512', privateKey, 'buffer')
      try {
        const secretKey = Uint8Array.from(digest.subarray(0, 32))
        secretKey[0]! &= 248
        secretKey[31]! &= 127
        secretKey[31]! |= 64
        return secretKey
      } finally {
        digest.fill(0)
      }
    },
  })
}

export declare namespace engine {
  /** Every `Ed25519` primitive this module implements. */
  type ReturnType = {
    [key in 'getPublicKey' | 'sign' | 'toMontgomerySecret']-?: NonNullable<
      Engine.Eddsa[key]
    >
  }

  type ErrorType = Errors.GlobalErrorType
}

function assertLength(key: Uint8Array): void {
  if (key.length !== 32)
    throw new RangeError(
      `Ed25519 private key must be 32 bytes, got ${key.length}`,
    )
}

function rawPublicKey(publicKey: crypto.KeyObject): Uint8Array {
  const der = publicKey.export({ format: 'der', type: 'spki' })
  return Uint8Array.from(der.subarray(-32))
}

function toPrivateKey(privateKey: Uint8Array): crypto.KeyObject {
  assertLength(privateKey)
  const der = Buffer.concat([privateKeyPrefix, privateKey])
  try {
    return crypto.createPrivateKey({
      format: 'der',
      key: der,
      type: 'pkcs8',
    })
  } finally {
    der.fill(0)
  }
}
