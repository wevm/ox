import { secp256k1 } from '@noble/curves/secp256k1'

import { Bytes_from } from '../bytes/from.js'
import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_from } from '../hex/from.js'
import type { Hex } from '../hex/types.js'
import type { Signature } from '../signature/types.js'

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const publicKey = Secp256k1.recoverPublicKey({
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 */
export function Secp256k1_recoverPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  parameters: Secp256k1_recoverPublicKey.Parameters<as>,
): Secp256k1_recoverPublicKey.ReturnType<as> {
  const { payload, signature, as = 'Hex' } = parameters
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const publicKey = `0x${signature_
    .recoverPublicKey(Hex_from(payload).substring(2))
    .toHex(false)}`
  if (as === 'Bytes') return Bytes_from(publicKey) as never
  return publicKey as never
}

export declare namespace Secp256k1_recoverPublicKey {
  type Parameters<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
    /** Format of the returned public key. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = Bytes_from.ErrorType | Hex_from.ErrorType | GlobalErrorType
}

Secp256k1_recoverPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_recoverPublicKey.ErrorType
