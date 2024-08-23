import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import type {
  CompactSignature,
  LegacySignature,
  Signature,
} from '../types/signature.js'
import type { Compute, OneOf } from '../types/utils.js'
import { assertSignature } from './assertSignature.js'
import { compactSignatureToSignature } from './compactSignatureToSignature.js'
import { deserializeSignature } from './deserializeSignature.js'
import { vToYParity } from './vToYParity.js'

/**
 * Instantiates a typed {@link Types#Signature} object from a {@link Types#Signature}, {@link Types#CompactSignature}, {@link Types#LegacySignature}, {@link Types#Bytes}, or {@link Types#Hex}.
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
 *
 * @alias ox!Signature.toSignature:function(1)
 */
export function toSignature(
  signature:
    | OneOf<Signature | CompactSignature | LegacySignature>
    | Hex
    | Bytes,
): Compute<Signature> {
  const signature_ = (() => {
    if (typeof signature === 'string') return deserializeSignature(signature)
    if (signature instanceof Uint8Array) return deserializeSignature(signature)
    if (signature.yParityAndS) return compactSignatureToSignature(signature)
    if (signature.v)
      return {
        r: signature.r,
        s: signature.s,
        yParity: vToYParity(signature.v),
      }
    return {
      r: signature.r,
      s: signature.s,
      yParity: signature.yParity,
    }
  })()
  assertSignature(signature_)
  return signature_
}

export declare namespace toSignature {
  type ErrorType =
    | assertSignature.ErrorType
    | deserializeSignature.ErrorType
    | compactSignatureToSignature.ErrorType
    | vToYParity.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
toSignature.parseError = (error: unknown) => error as toSignature.ErrorType
