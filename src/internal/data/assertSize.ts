import {
  SizeOverflowError,
  type SizeOverflowErrorType,
} from '../errors/data.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { size } from './size.js'

/** @internal */
export declare namespace assertSize {
  type ErrorType = size.ErrorType | SizeOverflowErrorType | ErrorType_
}
export function assertSize(hexOrBytes: Hex | Bytes, size_: number): void {
  if (size(hexOrBytes) > size_)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size_,
    })
}
