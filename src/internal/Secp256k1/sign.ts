import { secp256k1 } from '@noble/curves/secp256k1'

import type * as Errors from '../../Errors.js'
import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Signs the payload with the provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function Secp256k1_sign(options: Secp256k1_sign.Options): Signature {
  const { hash, payload, privateKey } = options
  const { r, s, recovery } = secp256k1.sign(
    Bytes_from(payload),
    Bytes_from(privateKey),
    ...(hash ? [{ prehash: true, lowS: true }] : []),
  )
  return {
    r,
    s,
    yParity: recovery,
  }
}

export declare namespace Secp256k1_sign {
  type Options = {
    /** If set to `true`, the payload will be hashed (sha256) before being signed. */
    hash?: boolean | undefined
    /** Payload to sign. */
    payload: Hex | Bytes
    /** ECDSA private key. */
    privateKey: Hex | Bytes
  }

  type ErrorType = Bytes_from.ErrorType | Errors.GlobalErrorType
}

Secp256k1_sign.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_sign.ErrorType
