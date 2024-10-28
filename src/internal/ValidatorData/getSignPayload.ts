import type { Errors } from '../../Errors.js'
import type { Address } from '../Address/types.js'
import type { Bytes } from '../Bytes/types.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Hex } from '../Hex/types.js'
import { ValidatorData_encode } from './encode.js'

/**
 * Gets the payload to use for signing [EIP-191 formatted](https://eips.ethereum.org/EIPS/eip-191#0x00) data with an intended validator.
 *
 * @example
 * ```ts twoslash
 * import { Hex, Secp256k1, ValidatorData } from 'ox'
 *
 * const payload = ValidatorData.getSignPayload({ // [!code focus]
 *   data: Hex.fromString('hello world'), // [!code focus]
 *   validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // [!code focus]
 * }) // [!code focus]
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param value - The data to get the sign payload for.
 * @returns The payload to use for signing.
 */
export function ValidatorData_getSignPayload(
  value: ValidatorData_getSignPayload.Value,
): Hex {
  return Hash_keccak256(ValidatorData_encode(value))
}

export declare namespace ValidatorData_getSignPayload {
  type Value = {
    data: Hex | Bytes
    validator: Address
  }

  type ErrorType =
    | Hash_keccak256.ErrorType
    | ValidatorData_encode.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
ValidatorData_getSignPayload.parseError = (error: unknown) =>
  error as ValidatorData_getSignPayload.ErrorType
