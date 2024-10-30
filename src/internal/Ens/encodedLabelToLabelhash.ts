import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/** @internal */
export function Ens_encodedLabelToLabelhash(label: string): Hex.Hex | null {
  if (label.length !== 66) return null
  if (label.indexOf('[') !== 0) return null
  if (label.indexOf(']') !== 65) return null
  const hash = `0x${label.slice(1, 65)}`
  if (!Hex.validate(hash, { strict: true })) return null
  return hash
}

export declare namespace Ens_encodedLabelToLabelhash {
  type ErrorType = Hex.validate.ErrorType | Errors.GlobalErrorType
}
