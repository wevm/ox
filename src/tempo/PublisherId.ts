import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import type * as Hex from '../core/Hex.js'

const parameters = /*#__PURE__*/ AbiParameters.from('address, bytes32')

/**
 * Computes the ID of a Key Publisher: `keccak256(abi.encode(creator, salt))`.
 *
 * A publisher lists issuers' signing keys that ZK signatures may use. Its ID
 * depends only on the account that creates it and the salt that account
 * chooses, so the ID is known before the publisher exists.
 *
 * [TIP-1132](https://docs.tempo.xyz/protocol/tips/tip-1132)
 *
 * @example
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 * import { PublisherId } from 'ox/tempo'
 *
 * const publisherId = PublisherId.from({
 *   creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   salt: Hash.keccak256(Hex.fromString('tempo:oidc-demo'))
 * })
 * // @log: '0x0f1827bc3bbfd0fe6e7bc724ebaaaf1e1acb874cb0fb5344411ffaf59f164245'
 * ```
 *
 * @param value - The creator and salt.
 * @returns The publisher ID.
 */
export function from(value: from.Value): Hex.Hex {
  const { creator, salt } = value
  return Hash.keccak256(AbiParameters.encode(parameters, [creator, salt]))
}

export declare namespace from {
  type Value = {
    /** The account that creates the publisher. */
    creator: Address.Address
    /** Any 32 bytes the creator chooses. */
    salt: Hex.Hex
  }

  type ErrorType =
    | AbiParameters.encode.ErrorType
    | Hash.keccak256.ErrorType
    | Errors.GlobalErrorType
}
