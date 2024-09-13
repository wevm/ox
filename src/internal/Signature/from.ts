import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { OneOf } from '../types.js'
import { Signature_assert } from './assert.js'
import { Signature_deserialize } from './deserialize.js'
import { Signature_fromRpc } from './fromRpc.js'
import type {
  Signature,
  Signature_Legacy,
  Signature_LegacyRpc,
  Signature_Rpc,
} from './types.js'
import { Signature_vToYParity } from './vToYParity.js'

/**
 * Instantiates a typed {@link ox#Signature.Signature} object from a {@link ox#Signature.Signature}, {@link ox#Signature.Compact}, {@link ox#Signature.Legacy}, {@link ox#Bytes.Bytes}, or {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.from({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @log: {
 * // @log:   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * // @log:   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * // @log:   yParity: 1
 * // @log: }
 * ```
 *
 * @example
 * ### From Serialized
 *
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.from('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db801')
 * // @log: {
 * // @log:   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * // @log:   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * // @log:   yParity: 1,
 * // @log: }
 * ```
 *
 * @example
 * ### From Legacy
 *
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.from({
 *   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 *   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 *   v: 27,
 * })
 * // @log: {
 * // @log:   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
 * // @log:   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
 * // @log:   yParity: 0
 * // @log: }
 * ```
 *
 * @param signature - The signature value to instantiate.
 * @returns The instantiated {@link ox#Signature.Signature}.
 */
export function Signature_from(
  signature:
    | OneOf<Signature | Signature_Legacy | Signature_Rpc | Signature_LegacyRpc>
    | Hex
    | Bytes,
): Signature {
  const signature_ = (() => {
    if (typeof signature === 'string') return Signature_deserialize(signature)
    if (signature instanceof Uint8Array) return Signature_deserialize(signature)
    if (
      typeof signature.v === 'string' ||
      typeof signature.yParity === 'string'
    )
      return Signature_fromRpc(signature)
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
    | Signature_vToYParity.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Signature_from.parseError = (error: unknown) =>
  error as Signature_from.ErrorType
