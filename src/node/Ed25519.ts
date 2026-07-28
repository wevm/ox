import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

const privateKeyPrefix = Buffer.from('302e020100300506032b657004220420', 'hex')

/**
 * Creates Node.js implementations of the [`Ed25519`](/api/Ed25519)
 * primitives, without installing them.
 *
 * Node's verifier does not implement Ox's ZIP-215 verification semantics, so
 * this engine deliberately omits `verify`. Public-key conversion and random
 * key generation also remain on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Ed25519, Engine } from 'ox'
 * import * as NodeEd25519 from 'ox/node/Ed25519'
 *
 * Engine.set(await NodeEd25519.create())
 *
 * Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns An engine supplying part of the `Ed25519` slot.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    Ed25519: {
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
    },
  })
}

export declare namespace create {
  /** The `Ed25519` slot, carrying every primitive this module implements. */
  type ReturnType = {
    Ed25519: {
      [key in 'getPublicKey' | 'sign' | 'toMontgomerySecret']-?: NonNullable<
        Engine.Eddsa[key]
      >
    }
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
