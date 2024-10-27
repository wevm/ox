import type * as Errors from '../../Errors.js'
import { Hex_SizeOverflowError } from './errors.js'
import { Hex_size } from './size.js'
import type { Hex } from './types.js'

/** @internal */
export function Hex_assertSize(hex: Hex, size_: number): void {
  if (Hex_size(hex) > size_)
    throw new Hex_SizeOverflowError({
      givenSize: Hex_size(hex),
      maxSize: size_,
    })
}

export declare namespace Hex_assertSize {
  type ErrorType =
    | Hex_size.ErrorType
    | Hex_SizeOverflowError
    | Errors.GlobalErrorType
}
