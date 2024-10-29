import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Address_from } from '../Address/from.js'
import type { Address } from '../Address/types.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Rlp_fromBytes } from '../Rlp/from.js'

/**
 * Computes contract address via [CREATE](https://ethereum.stackexchange.com/questions/68943/create-opcode-what-does-it-really-do/68945#68945) opcode.
 *
 * @example
 * ```ts twoslash
 * import { ContractAddress } from 'ox'
 *
 * ContractAddress.fromCreate({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   nonce: 0n,
 * })
 * // @log: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2'
 * ```
 *
 * @param options - Options for retrieving address.
 * @returns Contract Address.
 */
export function ContractAddress_fromCreate(
  options: ContractAddress_fromCreate.Options,
): Address {
  const from = Bytes.fromHex(Address_from(options.from))

  let nonce = Bytes.fromNumber(options.nonce)
  if (nonce[0] === 0) nonce = new Uint8Array([])

  return Address_from(
    `0x${Hash_keccak256(Rlp_fromBytes([from, nonce], { as: 'Hex' })).slice(26)}` as Address,
  )
}

export declare namespace ContractAddress_fromCreate {
  type Options = {
    /** The address the contract was deployed from. */
    from: Address
    /** The nonce of the transaction which deployed the contract. */
    nonce: bigint
  }

  type ErrorType =
    | Hash_keccak256.ErrorType
    | Address_from.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.fromNumber.ErrorType
    | Rlp_fromBytes.ErrorType
    | Errors.GlobalErrorType
}

ContractAddress_fromCreate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as ContractAddress_fromCreate.ErrorType
