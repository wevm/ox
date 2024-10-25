import type * as Errors from '../../Errors.js'
import type { Bytes } from '../Bytes/types.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_from } from '../Hex/from.js'
import { Hex_fromString } from '../Hex/fromString.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

/**
 * Encodes a personal sign message in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191#version-0x45-e): `0x19 ‖ "Ethereum Signed Message:\n" + message.length ‖ message`.
 *
 * @example
 * ```ts twoslash
 * import { Hex, PersonalMessage } from 'ox'
 *
 * const data = PersonalMessage.encode(Hex.fromString('hello world'))
 * // @log: '0x19457468657265756d205369676e6564204d6573736167653a0a313168656c6c6f20776f726c64'
 * // @log: (0x19 ‖ 'Ethereum Signed Message:\n11' ‖ 'hello world')
 * ```
 *
 * @param data - The data to encode.
 * @returns The encoded personal sign message.
 */
export function PersonalMessage_encode(data: Hex | Bytes): Hex {
  const message = Hex_from(data)
  return Hex_concat(
    // Personal Sign Format: `0x19 ‖ "Ethereum Signed Message:\n" ‖ message.length ‖ message`
    '0x19',
    Hex_fromString('Ethereum Signed Message:\n' + Hex_size(message)),
    message,
  )
}

export declare namespace PersonalMessage_encode {
  type ErrorType =
    | Hex_concat.ErrorType
    | Hex_from.ErrorType
    | Hex_fromString.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
PersonalMessage_encode.parseError = (error: unknown) =>
  error as PersonalMessage_encode.ErrorType
