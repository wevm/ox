import * as crypto from 'node:crypto'
import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'

/**
 * Creates Node.js implementations of the [`Keystore`](/api/Keystore)
 * primitives, without installing them.
 *
 * Most callers want {@link ox#Engine.load} instead, which installs every
 * implementation this entrypoint provides. Reach for this to take the
 * `Keystore` slot on its own, or to hold the implementation without touching
 * the installed engine.
 *
 * This engine deliberately omits scrypt. OpenSSL rejects Ox's default scrypt
 * parameter shape, so installing it would make valid existing calls fail.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Keystore } from 'ox'
 * import * as NodeKeystore from 'ox/node/Keystore'
 *
 * Engine.set(await NodeKeystore.create())
 *
 * Keystore.pbkdf2({ password: 'testpassword' })
 * ```
 *
 * @returns An engine supplying the `Keystore` slot.
 */
export function create(): Promise<create.ReturnType> {
  return Promise.resolve({
    Keystore: {
      aesCtrDecrypt: (key, iv, data) => {
        const cipher = crypto.createDecipheriv(
          `aes-${key.length * 8}-ctr`,
          key,
          iv,
        )
        return cipherData(cipher, data)
      },
      aesCtrEncrypt: (key, iv, data) => {
        const cipher = crypto.createCipheriv(
          `aes-${key.length * 8}-ctr`,
          key,
          iv,
        )
        return cipherData(cipher, data)
      },
      pbkdf2Sha256: (password, salt, options) =>
        copyAndClear(
          crypto.pbkdf2Sync(password, salt, options.c, options.dkLen, 'sha256'),
        ),
      pbkdf2Sha256Async: (password, salt, options) =>
        new Promise((resolve, reject) => {
          crypto.pbkdf2(
            password,
            salt,
            options.c,
            options.dkLen,
            'sha256',
            (error, key) => {
              if (error) return reject(error)
              try {
                resolve(copyAndClear(key))
              } catch (error) {
                reject(error)
              }
            },
          )
        }),
    },
  })
}

export declare namespace create {
  /** The `Keystore` slot, carrying every primitive this module implements. */
  type ReturnType = {
    Keystore: {
      [key in
        | 'aesCtrDecrypt'
        | 'aesCtrEncrypt'
        | 'pbkdf2Sha256'
        | 'pbkdf2Sha256Async']-?: NonNullable<Engine.Keystore[key]>
    }
  }

  type ErrorType = Errors.GlobalErrorType
}

function cipherData(
  cipher: crypto.Cipheriv | crypto.Decipheriv,
  data: Uint8Array,
): Uint8Array {
  const chunks: Buffer[] = []
  try {
    chunks.push(cipher.update(data))
    chunks.push(cipher.final())
    return copyAndClear(Buffer.concat(chunks))
  } finally {
    for (const chunk of chunks) chunk.fill(0)
  }
}

function copyAndClear(value: Buffer): Uint8Array {
  try {
    return Uint8Array.from(value)
  } finally {
    value.fill(0)
  }
}
