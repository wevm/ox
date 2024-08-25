import { SizeOverflowError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'
import { size } from './size.js'

/** @internal */
export function assertSize(bytes: Bytes, size_: number): void {
  if (size(bytes) > size_)
    throw new SizeOverflowError({
      givenSize: size(bytes),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace assertSize {
  type ErrorType = size.ErrorType | SizeOverflowError | GlobalErrorType
}
