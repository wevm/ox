import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import type { Compute, OneOf } from '../types.js'
import { Signature_assert } from './assert.js'
import { Signature_deserialize } from './deserialize.js'
import { Signature_fromCompact } from './fromCompact.js'
import type { Signature, Signature_Compact, Signature_Legacy } from './types.js'
import { Signature_vToYParity } from './vToYParity.js'

/**
 * Instantiates a typed {@link Signature#Signature} object from a {@link Signature#Signature}, {@link Signature#Compact}, {@link Signature#Legacy}, {@link Bytes#Bytes}, or {@link Hex#Hex}.
 *
 * @example
 * ```ts
 * import { Signature } from 'viem'
 *
 * Signature.from('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db801')
 * // {
 * //   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * //   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * //   yParity: 1,
 * // }
 * ```
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * Signature.from({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * })
 *
 * // {
 * //   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * //   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * //   yParity: 0
 * // }
 * ```
 *
 * @example
 * ```ts
 * import { Signature } from 'ox'
 *
 * Signature.from({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 *   v: 27,
 * })
 *
 * // {
 * //   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * //   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * //   yParity: 0
 * // }
 * ```
 */
export function Signature_from(
  signature:
    | OneOf<Signature | Signature_Compact | Signature_Legacy>
    | Hex
    | Bytes,
): Compute<Signature> {
  const signature_ = (() => {
    if (typeof signature === 'string') return Signature_deserialize(signature)
    if (signature instanceof Uint8Array) return Signature_deserialize(signature)
    if (signature.yParityAndS) return Signature_fromCompact(signature)
    if (signature.v)
      return {
        r: signature.r,
        s: signature.s,
        yParity: Signature_vToYParity(signature.v),
      }
    return {
      r: signature.r,
      s: signature.s,
      yParity: signature.yParity,
    }
  })()
  Signature_assert(signature_)
  return signature_
}

export declare namespace Signature_from {
  type ErrorType =
    | Signature_assert.ErrorType
    | Signature_deserialize.ErrorType
    | Signature_fromCompact.ErrorType
    | Signature_vToYParity.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Signature_from.parseError = (error: unknown) =>
  error as Signature_from.ErrorType
