import { secp256r1 } from '@noble/curves/p256'

import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Signs the payload with the provided private key and returns a P256 signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function P256_sign(options: P256_sign.Options): Signature {
  const { payload, privateKey } = options
  const { r, s, recovery } = secp256r1.sign(
    Bytes_from(payload),
    Bytes_from(privateKey),
  )
  return {
    r,
    s,
    yParity: recovery,
  }
}

export declare namespace P256_sign {
  type Options = {
    /** Payload to sign. */
    payload: Hex | Bytes
    /** ECDSA private key. */
    privateKey: Hex | Bytes
  }

  type ErrorType = Bytes_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
P256_sign.parseError = (error: unknown) => error as P256_sign.ErrorType
