import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import { Signature_assert } from './assert.js'
import type { Signature } from './types.js'

/**
 * Serializes a {@link ox#Signature.Signature} to {@link ox#(Hex:type)} or {@link ox#(Bytes:namespace).(Bytes:type)}.
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
  signature: Signature<boolean>,
  options: Signature_serialize.Options<as> = {},
): Signature_serialize.ReturnType<as> {
  const { as = 'Hex' } = options

  Signature_assert(signature)

  const r = signature.r
  const s = signature.s

  const signature_ = Hex.concat(
    Hex.fromNumber(r, { size: 32 }),
    Hex.fromNumber(s, { size: 32 }),
    // If the signature is recovered, add the recovery byte to the signature.
    typeof signature.yParity === 'number'
      ? Hex.fromNumber(signature.yParity, { size: 1 })
      : '0x',
  )

  if (as === 'Hex') return signature_ as Signature_serialize.ReturnType<as>
  return Bytes.fromHex(signature_) as Signature_serialize.ReturnType<as>
}

export declare namespace Signature_serialize {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Type to serialize the signature as.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Hex' ? Hex : never)
    | (as extends 'Bytes' ? Bytes : never)

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

Signature_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_serialize.ErrorType
