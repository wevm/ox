import { SizeOverflowError } from '../Errors/data.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from './size.js'
import type { Hex } from './types.js'

/** @internal */
export function Hex_assertSize(hex: Hex, size_: number): void {
  if (Hex_size(hex) > size_)
    throw new SizeOverflowError({
      givenSize: Hex_size(hex),
      maxSize: size_,
    })
}

export declare namespace Hex_assertSize {
  type ErrorType = Hex_size.ErrorType | SizeOverflowError | GlobalErrorType
}
