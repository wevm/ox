import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'

export function Ens_encodeLabelhash(hash: Hex): `[${string}]` {
  return `[${hash.slice(2)}]`
}

export declare namespace Ens_encodeLabelhash {
  type ErrorType = GlobalErrorType
}
