import { secp256k1 } from '@noble/curves/secp256k1'

import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'

type As = 'Bytes' | 'Hex'

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
export function recoverPublicKey<as extends As = 'Hex'>(
  parameters: recoverPublicKey.Parameters<as>,
): recoverPublicKey.ReturnType<as> {
  const { payload, signature, as = 'Hex' } = parameters
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const publicKey = `0x${signature_
    .recoverPublicKey(toHex(payload).substring(2))
    .toHex(false)}`
  if (as === 'Bytes') return toBytes(publicKey) as never
  return publicKey as never
}

export declare namespace recoverPublicKey {
  type Parameters<as extends As = 'Hex'> = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
    /** Format of the returned public key. @default 'Hex' */
    as?: as | As | undefined
  }

  type ReturnType<as extends As> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = toBytes.ErrorType | toHex.ErrorType | GlobalErrorType
}

recoverPublicKey.parseError = (error: unknown) =>
  error as recoverPublicKey.ErrorType
