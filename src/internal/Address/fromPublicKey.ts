import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { PublicKey_serialize } from '../PublicKey/serialize.js'
import type { PublicKey } from '../PublicKey/types.js'
import { Address_from } from './from.js'
import type { Address } from './types.js'

/**
 * Converts an ECDSA public key to an {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address, PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from(
 *   '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
 * )
 * const address = Address.fromPublicKey(publicKey)
 * // @log: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
 * ```
 *
 * @param publicKey - The ECDSA public key to convert to an {@link ox#Address.Address}.
 * @param options - Conversion options.
 * @returns The {@link ox#Address.Address}.
 */
export function Address_fromPublicKey(
  publicKey: PublicKey,
  options: Address_fromPublicKey.Options = {},
): Address {
  const address = Hash_keccak256(
    `0x${PublicKey_serialize(publicKey).slice(4)}`,
  ).substring(26)
  return Address_from(`0x${address}`, options)
}

export declare namespace Address_fromPublicKey {
  interface Options {
    /**
     * Whether to checksum the address.
     *
     * @default false
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | Hash_keccak256.ErrorType
    | PublicKey_serialize.ErrorType
    | GlobalErrorType
}

Address_fromPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Address_fromPublicKey.ErrorType
