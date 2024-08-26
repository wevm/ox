import { Address_from } from '../address/from.js'
import type { Address } from '../address/types.js'
import { Bytes_from } from '../bytes/from.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Rlp_fromBytes } from '../rlp/from.js'

/**
 * Generates contract address via [CREATE](https://ethereum.stackexchange.com/questions/68943/create-opcode-what-does-it-really-do/68945#68945) opcode.
 *
 * - Docs: https://oxlib.sh/api/contractAddress/getCreateAddress
 *
 * @example
 * ```ts twoslash
 * import { ContractAddress } from 'ox'
 *
 * ContractAddress.getCreateAddress({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   nonce: 0n,
 * })
 * // '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2'
 * ```
 */
export function ContractAddress_getCreateAddress(
  opts: ContractAddress_getCreateAddress.Options,
) {
  const from = Bytes_from(Address_from(opts.from))

  let nonce = Bytes_from(opts.nonce)
  if (nonce[0] === 0) nonce = new Uint8Array([])

  return Address_from(
    `0x${Hash_keccak256(Rlp_fromBytes([from, nonce])).slice(26)}` as Address,
  )
}

export declare namespace ContractAddress_getCreateAddress {
  type Options = {
    from: Address
    nonce: bigint
  }

  type ErrorType =
    | Hash_keccak256.ErrorType
    | Address_from.ErrorType
    | Bytes_from.ErrorType
    | Rlp_fromBytes.ErrorType
    | GlobalErrorType
}

ContractAddress_getCreateAddress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as ContractAddress_getCreateAddress.ErrorType
