import { secp256r1 } from '@noble/curves/p256'

import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const publicKey = P256.recoverPublicKey({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function P256_recoverPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: P256_recoverPublicKey.Options<as>,
): P256_recoverPublicKey.ReturnType<as> {
  const { payload, signature, as = 'Hex', compressed = false } = options
  const { r, s, yParity } = signature
  const signature_ = new secp256r1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const publicKey = `0x${signature_
    .recoverPublicKey(Hex_from(payload).substring(2))
    .toHex(compressed)}`
  if (as === 'Bytes') return Bytes_from(publicKey) as never
  return publicKey as never
}

export declare namespace P256_recoverPublicKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** Whether to compress the public key. */
    compressed?: boolean | undefined
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = Bytes_from.ErrorType | Hex_from.ErrorType | GlobalErrorType
}

P256_recoverPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as P256_recoverPublicKey.ErrorType
