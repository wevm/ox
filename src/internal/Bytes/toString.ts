import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import { assertSize } from './assertSize.js'

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
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
export function toString(
  bytes: Bytes.Bytes,
  options: Bytes.toString.Options = {},
): string {
  const { size } = options

  let bytes_ = bytes
  if (typeof size !== 'undefined') {
    assertSize(bytes_, size)
    bytes_ = Bytes.trimRight(bytes_)
  }
  return decoder.decode(bytes_)
}

export declare namespace toString {
  export type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  export type ErrorType =
    | assertSize.ErrorType
    | Bytes.trimRight.ErrorType
    | Errors.GlobalErrorType
}

toString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.toString.ErrorType

const decoder = /*#__PURE__*/ new TextDecoder()
