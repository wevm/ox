import * as Address from '../../Address.js'
import * as Bytes from '../../Bytes.js'
import type * as ContractAddress from '../../ContractAddress.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'
import * as Rlp from '../../Rlp.js'

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
export function fromCreate(
  options: ContractAddress.fromCreate.Options,
): Address.Address {
  const from = Bytes.fromHex(Address.from(options.from))

  let nonce = Bytes.fromNumber(options.nonce)
  if (nonce[0] === 0) nonce = new Uint8Array([])

  return Address.from(
    `0x${Hash.keccak256(Rlp.fromBytes([from, nonce], { as: 'Hex' })).slice(26)}` as Address.Address,
  )
}

export declare namespace fromCreate {
  interface Options {
    /** The address the contract was deployed from. */
    from: Address.Address
    /** The nonce of the transaction which deployed the contract. */
    nonce: bigint
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | Address.from.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.fromNumber.ErrorType
    | Rlp.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

fromCreate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromCreate.ErrorType
