import type { Address } from 'abitype'

import { toAddress } from '../address/toAddress.js'
import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import { encodeRlp } from '../rlp/encodeRlp.js'

/**
 * Generates contract address via [CREATE](https://ethereum.stackexchange.com/questions/68943/create-opcode-what-does-it-really-do/68945#68945) opcode.
 *
 * - Docs: https://oxlib.sh/api/contractAddress/getCreateAddress
 *
 * @example
 * import { ContractAddress } from 'ox'
 * ContractAddress.getCreateAddress({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   nonce: 0n,
 * })
 * // '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2'
 */
export function getCreateAddress(opts: getCreateAddress.Options) {
  const from = toBytes(toAddress(opts.from))

  let nonce = toBytes(opts.nonce)
  if (nonce[0] === 0) nonce = new Uint8Array([])

  return toAddress(
    `0x${keccak256(encodeRlp([from, nonce], 'bytes')).slice(26)}` as Address,
  )
}

export declare namespace getCreateAddress {
  type Options = {
    from: Address
    nonce: bigint
  }

  type ErrorType =
    | keccak256.ErrorType
    | toAddress.ErrorType
    | toBytes.ErrorType
    | encodeRlp.ErrorType
    | GlobalErrorType
}

getCreateAddress.parseError = (error: unknown) =>
  error as getCreateAddress.ErrorType
