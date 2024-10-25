import type * as Errors from '../../Errors.js'
import { from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import { fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/** @internal */
export function Base58_from(value: Hex | Bytes) {
  let bytes = from(value)

  let integer = (() => {
    let hex = value
    if (value instanceof Uint8Array) hex = fromBytes(bytes)
    return BigInt(hex as string)
  })()

  let result = ''
  while (integer > 0n) {
    const remainder = Number(integer % 58n)
    integer = integer / 58n
    result = alphabet[remainder] + result
  }

  while (bytes.length > 1 && bytes[0] === 0) {
    result = '1' + result
    bytes = bytes.slice(1)
  }

  return result
}

/** @internal */
export declare namespace Base58_from {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
Base58_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_from.ErrorType
