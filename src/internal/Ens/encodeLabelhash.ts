import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'

/** @internal */
export function Ens_encodeLabelhash(hash: Hex): `[${string}]` {
  return `[${hash.slice(2)}]`
}

export declare namespace Ens_encodeLabelhash {
  type ErrorType = Errors.GlobalErrorType
}
