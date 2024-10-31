import type * as Address from '../../Address.js'
import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Encodes data with a validator in [ERC-191 format](https://eips.ethereum.org/EIPS/eip-191#version-0x00): `0x19 ‖ 0x00 ‖ <intended validator address> ‖ <data to sign>`.
 *
 * @example
 * ```ts twoslash
 * import { Hex, ValidatorData } from 'ox'
 *
 * const encoded = ValidatorData.encode({
 *   data: Hex.fromString('hello world'),
 *   validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
 * })
 * // @log: '0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64'
 * // @log: '0x19 ‖ 0x00 ‖ 0xd8da6bf26964af9d7eed9e03e53415d37aa96045 ‖ "hello world"'
 * ```
 *
 * @param value - The data to encode.
 * @returns The encoded personal sign message.
 */
export function ValidatorData_encode(
  value: ValidatorData_encode.Value,
): Hex.Hex {
  const { data, validator } = value
  return Hex.concat(
    // Validator Data Format: `0x19 ‖ 0x00 ‖ <intended validator address> ‖ <data to sign>`
    '0x19',
    '0x00',
    validator,
    Hex.from(data),
  )
}

export declare namespace ValidatorData_encode {
  type Value = {
    data: Hex.Hex | Bytes
    validator: Address.Address
  }

  type ErrorType =
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
ValidatorData_encode.parseError = (error: unknown) =>
  error as ValidatorData_encode.ErrorType
