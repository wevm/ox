import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Hex_from } from '../hex/from.js'
import type { Hex } from '../hex/types.js'
import { Address_from } from './from.js'
import type { Address } from './types.js'

/**
 * Converts an ECDSA public key to an Ethereum address.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.fromPublicKey('0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5')
 * // '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
 * ```
 */
export function Address_fromPublicKey(
  publicKey: Hex | Bytes,
  options: Address_fromPublicKey.Options = {},
): Address {
  const address = Hash_keccak256(`0x${Hex_from(publicKey).slice(4)}`).substring(
    26,
  )
  return Address_from(`0x${address}`, options)
}

export declare namespace Address_fromPublicKey {
  type Options = Address_from.Options

  type ReturnType = Address

  type ErrorType =
    | Hash_keccak256.ErrorType
    | Hex_from.ErrorType
    | GlobalErrorType
}

Address_fromPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address_fromPublicKey.ErrorType
