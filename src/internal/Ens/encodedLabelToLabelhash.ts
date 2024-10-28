import type { Errors } from '../../Errors.js'
import type { Hex } from '../Hex/types.js'
import { Hex_validate } from '../Hex/validate.js'

/** @internal */
export function Ens_encodedLabelToLabelhash(label: string): Hex | null {
  if (label.length !== 66) return null
  if (label.indexOf('[') !== 0) return null
  if (label.indexOf(']') !== 65) return null
  const hash = `0x${label.slice(1, 65)}`
  if (!Hex_validate(hash)) return null
  return hash
}

export declare namespace Ens_encodedLabelToLabelhash {
  type ErrorType = Hex_validate.ErrorType | Errors.GlobalErrorType
}
