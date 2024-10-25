import type * as Errors from '../../Errors.js'
import type { Bytes } from '../Bytes/types.js'
import { concat } from '../Hex/concat.js'
import { from } from '../Hex/from.js'
import { fromString } from '../Hex/fromString.js'
import { size } from '../Hex/size.js'
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
  const message = from(data)
  return concat(
    // Personal Sign Format: `0x19 ‖ "Ethereum Signed Message:\n" ‖ message.length ‖ message`
    '0x19',
    fromString('Ethereum Signed Message:\n' + size(message)),
    message,
  )
}

export declare namespace PersonalMessage_encode {
  type ErrorType =
    | concat.ErrorType
    | from.ErrorType
    | fromString.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
PersonalMessage_encode.parseError = (error: unknown) =>
  error as PersonalMessage_encode.ErrorType
