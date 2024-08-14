import {
  SizeOverflowError,
  type SizeOverflowErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { type SizeErrorType, size } from './size.js'

export type AssertSizeErrorType =
  | SizeOverflowErrorType
  | SizeErrorType
  | ErrorType

/** @internal */
export function assertSize(hexOrBytes: Hex | Bytes, size_: number): void {
  if (size(hexOrBytes) > size_)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size_,
    })
}
