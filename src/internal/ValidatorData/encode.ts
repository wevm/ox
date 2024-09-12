import type { Address } from '../Address/types.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'

/**
 * Encodes data with a validator in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191#version-0x00): `0x19 ‖ 0x00 ‖ <intended validator address> ‖ <data to sign>`.
 *
 * @example
 * ```ts twoslash
 * import { Hex, ValidatorData } from 'ox'
 *
 * const encoded = ValidatorData.encode({
 *   data: Hex.from('hello world'),
 *   validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
 * })
 * // @log: '0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64'
 * // @log: '0x19 ‖ 0x00 ‖ 0xd8da6bf26964af9d7eed9e03e53415d37aa96045 ‖ "hello world"'
 * ```
 *
 * @param data - The data to encode.
 * @returns The encoded personal sign message.
 */
export function ValidatorData_encode(value: ValidatorData_encode.Value): Hex {
  const { data, validator } = value
  return Hex_concat(
    // Validator Data Format: `0x19 ‖ 0x00 ‖ <intended validator address> ‖ <data to sign>`
    Hex_from(0x19),
    Hex_from(0x00),
    validator,
    Hex_from(data),
  )
}

export declare namespace ValidatorData_encode {
  type Value = {
    data: Hex | Bytes
    validator: Address
  }

  type ErrorType = Hex_concat.ErrorType | Hex_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
ValidatorData_encode.parseError = (error: unknown) =>
  error as ValidatorData_encode.ErrorType
