import { secp256k1 } from '@noble/curves/secp256k1'

import { Bytes_fromHex } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import { Signature_toCompact } from './toCompact.js'
import type { Signature } from './types.js'

/**
 * Serializes a {@link ox#Signature.Signature} to {@link ox#Hex.Hex} or {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.serialize({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * })
 * // @log: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c'
 * ```
 *
 * @param signature - The signature to serialize.
 * @returns The serialized signature.
 */
export function Signature_serialize<as extends 'Hex' | 'Bytes' = 'Hex'>(
  signature: Signature,
  options: Signature_serialize.Options<as> = {},
): Signature_serialize.ReturnType<as> {
  const { compact = false, as = 'Hex' } = options

  const r = signature.r
  const s = (() => {
    if (compact) return Signature_toCompact(signature as Signature).yParityAndS
    return signature.s
  })()
  let signature_ = `0x${new secp256k1.Signature(r, s!).toCompactHex()}` as const

  // If the signature is not compact, add the recovery byte to the signature.
  if (!compact)
    signature_ = `${signature_}${signature.yParity === 0 ? '00' : '01'}`

  if (as === 'Hex') return signature_ as Signature_serialize.ReturnType<as>
  return Bytes_fromHex(signature_) as Signature_serialize.ReturnType<as>
}

export declare namespace Signature_serialize {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Whether to serialize the signature as a compact signature.
     * @default false
     */
    compact?: boolean | undefined
    /**
     * Type to serialize the signature as.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Hex' ? Hex : never)
    | (as extends 'Bytes' ? Bytes : never)

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Signature_toCompact.ErrorType
    | GlobalErrorType
}

Signature_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_serialize.ErrorType
