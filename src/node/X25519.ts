import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

const privateKeyPrefix = Buffer.from('302e020100300506032b656e04220420', 'hex')
const publicKeyPrefix = Buffer.from('302a300506032b656e032100', 'hex')

/**
 * Creates Node.js implementations of the [`X25519`](/api/X25519) primitives,
 * without installing them.
 *
 * Random key generation remains on Ox's default implementation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, X25519 } from 'ox'
 * import * as NodeX25519 from 'ox/node/X25519'
 *
 * Engine.set(await NodeX25519.create())
 *
 * X25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @returns An engine supplying part of the `X25519` slot.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    X25519: {
      getPublicKey: (privateKey) =>
        rawPublicKey(crypto.createPublicKey(toPrivateKey(privateKey))),
      getSharedSecret: (privateKey, publicKey) =>
        copyAndClear(
          crypto.diffieHellman({
            privateKey: toPrivateKey(privateKey),
            publicKey: toPublicKey(publicKey),
          }),
        ),
    },
  })
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
