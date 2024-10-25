import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/** @internal */
export function assertSize(bytes: Bytes.Bytes, size_: number): void {
  if (Bytes.size(bytes) > size_)
    throw new Bytes.SizeOverflowError({
      givenSize: Bytes.size(bytes),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace assertSize {
  type ErrorType =
    | Bytes.size.ErrorType
    | Bytes.SizeOverflowError
    | Errors.GlobalErrorType
}
