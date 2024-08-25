import { SizeOverflowError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { size } from './size.js'

/** @internal */
export function assertSize(hex: Hex, size_: number): void {
  if (size(hex) > size_)
    throw new SizeOverflowError({
      givenSize: size(hex),
      maxSize: size_,
    })
}

/** @internal */
export declare namespace assertSize {
  type ErrorType = size.ErrorType | SizeOverflowError | GlobalErrorType
}
