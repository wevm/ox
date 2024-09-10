import type { GlobalErrorType } from '../Errors/error.js'
import { Bytes_SizeOverflowError } from './errors.js'
import { Bytes_size } from './size.js'
import type { Bytes } from './types.js'

/** @internal */
export function Bytes_assertSize(bytes: Bytes, size_: number): void {
  if (Bytes_size(bytes) > size_)
    throw new Bytes_SizeOverflowError({
      givenSize: Bytes_size(bytes),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace Bytes_assertSize {
  type ErrorType =
    | Bytes_size.ErrorType
    | Bytes_SizeOverflowError
    | GlobalErrorType
}
