import { SizeOverflowError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import { Hex_size } from './size.js'

/** @public */
export function Hex_assertSize(hex: Hex, size_: number): void {
  if (Hex_size(hex) > size_)
    throw new SizeOverflowError({
      givenSize: Hex_size(hex),
      maxSize: size_,
    })
}

/** @public */
export declare namespace Hex_assertSize {
  type ErrorType = Hex_size.ErrorType | SizeOverflowError | GlobalErrorType
}
