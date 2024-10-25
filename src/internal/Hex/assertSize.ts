import * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

export function assertSize(hex: Hex.Hex, size_: number): void {
  if (Hex.size(hex) > size_)
    throw new Errors.SizeOverflowError({
      givenSize: Hex.size(hex),
      maxSize: size_,
    })
}

export declare namespace assertSize {
  type ErrorType =
    | Hex.size.ErrorType
    | Errors.SizeOverflowError
    | Errors.GlobalErrorType
}
