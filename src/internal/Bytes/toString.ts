import type * as Errors from '../../Errors.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_trimRight } from './trim.js'
import type { Bytes } from './types.js'

const decoder = /*#__PURE__*/ new TextDecoder()

/**
 * Decodes a {@link ox#Bytes.Bytes} into a string.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.toString(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // @log: 'Hello world'
 * ```
 *
 * @param bytes - The {@link ox#Bytes.Bytes} to decode.
 * @param options -
 * @returns Decoded string.
 */
export function Bytes_toString(
  bytes: Bytes,
  options: Bytes_toString.Options = {},
): string {
  const { size } = options

  let bytes_ = bytes
  if (typeof size !== 'undefined') {
    Bytes_assertSize(bytes_, size)
    bytes_ = Bytes_trimRight(bytes_)
  }
  return decoder.decode(bytes_)
}

export declare namespace Bytes_toString {
  export type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  export type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_trimRight.ErrorType
    | Errors.GlobalErrorType
}

Bytes_toString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toString.ErrorType
