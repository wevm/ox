import type { Errors } from '../../Errors.js'
import { Signature_InvalidVError } from './errors.js'
import type { Signature } from './types.js'

/** @internal */
export function Signature_vToYParity(v: number): Signature['yParity'] {
  if (v === 0 || v === 27) return 0
  if (v === 1 || v === 28) return 1
  if (v >= 35) return v % 2 === 0 ? 1 : 0
  throw new Signature_InvalidVError({ value: v })
}

/** @internal */
export declare namespace Signature_vToYParity {
  type ErrorType = Signature_InvalidVError | Errors.GlobalErrorType
}
