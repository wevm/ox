import type { Errors } from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import type { Bytes } from '../Bytes/types.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { PersonalMessage_encode } from './encode.js'

/**
 * Gets the payload to use for signing an [EIP-191 formatted](https://eips.ethereum.org/EIPS/eip-191#version-0x45-e) personal message.
 *
 * @example
 * ```ts twoslash
 * import { Hex, PersonalMessage, Secp256k1 } from 'ox'
 *
 * const payload = PersonalMessage.getSignPayload(Hex.fromString('hello world')) // [!code focus]
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param data - The data to get the sign payload for.
 * @returns The payload to use for signing.
 */
export function PersonalMessage_getSignPayload(data: Hex | Bytes): Hex {
  return Hash_keccak256(PersonalMessage_encode(data))
}

export declare namespace PersonalMessage_getSignPayload {
  type ErrorType =
    | Hash_keccak256.ErrorType
    | PersonalMessage_encode.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
PersonalMessage_getSignPayload.parseError = (error: unknown) =>
  error as PersonalMessage_getSignPayload.ErrorType
