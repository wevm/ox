import type { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'

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
  const message = Hex.from(data)
  return Hex.concat(
    // Personal Sign Format: `0x19 ‖ "Ethereum Signed Message:\n" ‖ message.length ‖ message`
    '0x19',
    Hex.fromString('Ethereum Signed Message:\n' + Hex.size(message)),
    message,
  )
}

export declare namespace PersonalMessage_encode {
  type ErrorType =
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
PersonalMessage_encode.parseError = (error: unknown) =>
  error as PersonalMessage_encode.ErrorType
