import { secp256k1 } from '@noble/curves/secp256k1'

import { Bytes_fromHex } from '../bytes/from.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'
import { Signature_toCompact } from './toCompact.js'

/**
 * Serializes a {@link Signature#Signature} to {@link Hex#Hex} or {@link Bytes#Bytes}.
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * const signature = Signature.serialize({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1
 * })
 * // '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c'
 * ```
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * const signature = Signature.serialize({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   yParityAndS:
 *     57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * })
 * // '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'
 * ```
 */
export function Signature_serialize<as extends 'Hex' | 'Bytes' = 'Hex'>(
  signature_: Signature,
  options: Signature_serialize.Options<as> = {},
): Signature_serialize.ReturnType<as> {
  const { compact = false, as = 'Hex' } = options

  const r = signature_.r
  const s = (() => {
    if (compact) return Signature_toCompact(signature_ as Signature).yParityAndS
    return signature_.s
  })()
  let signature = `0x${new secp256k1.Signature(r, s!).toCompactHex()}` as const

  // If the signature is not compact, add the recovery byte to the signature.
  if (!compact)
    signature = `${signature}${signature_.yParity === 0 ? '00' : '01'}`

  if (as === 'Hex') return signature as Signature_serialize.ReturnType<as>
  return Bytes_fromHex(signature) as Signature_serialize.ReturnType<as>
}

export declare namespace Signature_serialize {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    compact?: boolean | undefined
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
