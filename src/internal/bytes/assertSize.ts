import type { Bytes } from '../bytes/types.js'
import { SizeOverflowError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Bytes_size } from './size.js'

/** @internal */
export function Bytes_assertSize(bytes: Bytes, size_: number): void {
  if (Bytes_size(bytes) > size_)
    throw new SizeOverflowError({
      givenSize: Bytes_size(bytes),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace Bytes_assertSize {
  type ErrorType = Bytes_size.ErrorType | SizeOverflowError | GlobalErrorType
}
