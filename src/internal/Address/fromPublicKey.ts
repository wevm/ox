import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'
import * as PublicKey from '../../PublicKey.js'

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
 * @returns The {@link ox#Address.Address} corresponding to the public key.
 */
export function fromPublicKey(
  publicKey: PublicKey.PublicKey,
  options: Address.fromPublicKey.Options = {},
): Address.Address {
  const address = Hash.keccak256(
    `0x${PublicKey.serialize(publicKey).slice(4)}`,
  ).substring(26)
  return Address.from(`0x${address}`, options)
}

export declare namespace fromPublicKey {
  interface Options {
    /**
     * Whether to checksum the address.
     *
     * @default false
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | PublicKey.serialize.ErrorType
    | Errors.GlobalErrorType
}

fromPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromPublicKey.ErrorType
