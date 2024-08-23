import { SizeOverflowError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { size } from './size.js'

export function assertSize(hexOrBytes: Hex | Bytes, size_: number): void {
  if (size(hexOrBytes) > size_)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size_,
    })
}

export declare namespace assertSize {
  type ErrorType = size.ErrorType | SizeOverflowError | GlobalErrorType
}
