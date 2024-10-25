import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

export function assertSize(hex: Hex.Hex, size_: number): void {
  if (Hex.size(hex) > size_)
    throw new Hex.SizeOverflowError({
      givenSize: Hex.size(hex),
      maxSize: size_,
    })
}

export declare namespace assertSize {
  type ErrorType =
    | Hex.size.ErrorType
    | Hex.SizeOverflowError
    | Errors.GlobalErrorType
}
