import { secp256k1 } from '@noble/curves/secp256k1'

import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'

type To = 'bytes' | 'hex'

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
export function recoverPublicKey<to extends To = 'hex'>(
  parameters: recoverPublicKey.Parameters<to>,
): recoverPublicKey.ReturnType<to> {
  const { payload, signature, to = 'hex' } = parameters
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const publicKey = `0x${signature_
    .recoverPublicKey(toHex(payload).substring(2))
    .toHex(false)}`
  if (to === 'bytes') return toBytes(publicKey) as never
  return publicKey as never
}

export declare namespace recoverPublicKey {
  type Parameters<to extends To = 'hex'> = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
    /** Format of the returned public key. @default 'hex' */
    to?: to | To | undefined
  }

  type ReturnType<to extends To = 'hex'> =
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'hex' ? Hex : never)

  type ErrorType = toBytes.ErrorType | toHex.ErrorType | GlobalErrorType
}

recoverPublicKey.parseError = (error: unknown) =>
  error as recoverPublicKey.ErrorType
