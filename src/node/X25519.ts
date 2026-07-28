import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

export * from '../core/X25519.js'

const privateKeyPrefix = Buffer.from('302e020100300506032b656e04220420', 'hex')
const publicKeyPrefix = Buffer.from('302a300506032b656e032100', 'hex')

/**
 * Creates a Node.js implementation of the [`X25519`](/api/X25519) engine slot,
 * without installing it.
 *
 * Random key generation remains on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { X25519 } from 'ox/node'
 *
 * await Engine.install({ X25519: X25519.engine() })
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns The raw `X25519` engine slot.
 */
export function engine(): Promise<engine.ReturnType> {
  return Promise.resolve({
    getPublicKey: (privateKey) =>
      rawPublicKey(crypto.createPublicKey(toPrivateKey(privateKey))),
    getSharedSecret: (privateKey, publicKey) =>
      copyAndClear(
        crypto.diffieHellman({
          privateKey: toPrivateKey(privateKey),
          publicKey: toPublicKey(publicKey),
        }),
      ),
  })
}

export declare namespace engine {
  /** Every `X25519` primitive this module implements. */
  type ReturnType = {
    [key in 'getPublicKey' | 'getSharedSecret']-?: NonNullable<Engine.Ecdh[key]>
  }

  type ErrorType = Errors.GlobalErrorType
}

function copyAndClear(value: Buffer): Uint8Array {
  try {
    return Uint8Array.from(value)
  } finally {
    value.fill(0)
  }
}

function assertLength(key: Uint8Array, type: 'private' | 'public'): void {
  if (key.length !== 32)
    throw new RangeError(
      `X25519 ${type} key must be 32 bytes, got ${key.length}`,
    )
}

function rawPublicKey(publicKey: crypto.KeyObject): Uint8Array {
  const der = publicKey.export({ format: 'der', type: 'spki' })
  return Uint8Array.from(der.subarray(-32))
}

function toPrivateKey(privateKey: Uint8Array): crypto.KeyObject {
  assertLength(privateKey, 'private')
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

function toPublicKey(publicKey: Uint8Array): crypto.KeyObject {
  assertLength(publicKey, 'public')
  return crypto.createPublicKey({
    format: 'der',
    key: Buffer.concat([publicKeyPrefix, publicKey]),
    type: 'spki',
  })
}
