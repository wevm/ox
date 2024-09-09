import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import { InvalidSignatureYParityError } from './errors.js'
import type { Signature } from './types.js'
import { Signature_vToYParity } from './vToYParity.js'

/**
 * Converts a {@link ox#Signature.Rpc} into a {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const signature = Signature.fromRpc({
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   yParity: '0x0',
 * })
 * ```
 *
 * @param signature - The {@link ox#Signature.Rpc} to convert.
 * @returns The converted {@link ox#Signature.Signature}.
 */
export function Signature_fromRpc(signature: {
  r: Hex
  s: Hex
  yParity?: Hex | undefined
  v?: Hex | undefined
}): Signature {
  const yParity = (() => {
    const v = signature.v ? Number(signature.v) : undefined
    let yParity = signature.yParity ? Number(signature.yParity) : undefined
    if (typeof v === 'number' && typeof yParity !== 'number')
      yParity = Signature_vToYParity(v)
    if (typeof yParity !== 'number')
      throw new InvalidSignatureYParityError({ value: signature.yParity })
    return yParity
  })()

  return {
    r: BigInt(signature.r),
    s: BigInt(signature.s),
    yParity,
  }
}

export declare namespace Signature_fromRpc {
  type ErrorType = GlobalErrorType
}

Signature_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_fromRpc.ErrorType
