import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_isHex } from '../Hex/isHex.js'
import type { Hex } from '../Hex/types.js'

/** @internal */
export function Ens_encodedLabelToLabelhash(label: string): Hex | null {
  if (label.length !== 66) return null
  if (label.indexOf('[') !== 0) return null
  if (label.indexOf(']') !== 65) return null
  const hash = `0x${label.slice(1, 65)}`
  if (!Hex_isHex(hash)) return null
  return hash
}

export declare namespace Ens_encodedLabelToLabelhash {
  type ErrorType = Hex_isHex.ErrorType | GlobalErrorType
}
