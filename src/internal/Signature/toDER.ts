import { secp256k1 } from '@noble/curves/secp256k1'
import type { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import type { Signature } from './types.js'

/**
 * Converts a {@link ox#Signature.Signature} to DER-encoded format.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.from({
 *   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 * })
 *
 * const signature_der = Signature.toDER(signature)
 * // @log: '0x304402206e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf02204a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8'
 * ```
 *
 * @param signature - The signature to convert.
 * @param options - Conversion options.
 * @returns The DER-encoded signature.
 */
export function Signature_toDER<as extends 'Hex' | 'Bytes' = 'Hex'>(
  signature: Signature<boolean>,
  options: Signature_toDER.Options<as> = {},
): Signature_toDER.ReturnType<as> {
  const { as = 'Hex' } = options
  const sig = new secp256k1.Signature(signature.r, signature.s)
  return as === 'Hex'
    ? (`0x${sig.toDERHex()}` as never)
    : (sig.toDERRawBytes() as never)
}

export declare namespace Signature_toDER {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned signature.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = Errors.GlobalErrorType
}
