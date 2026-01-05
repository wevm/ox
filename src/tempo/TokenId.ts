import * as AbiParameters from '../core/AbiParameters.js'
import * as Address from '../core/Address.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'

const tip20Prefix = '0x20c0'

export type TokenId = bigint
export type TokenIdOrAddress = TokenId | Address.Address

/**
 * Converts a token ID or address to a token ID.
 *
 * TIP-20 is Tempo's native token standard for stablecoins with deterministic addresses
 * derived from sequential token IDs (prefix `0x20c0`).
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenId } from 'ox/tempo'
 *
 * const tokenId = TokenId.from(1n)
 * ```
 *
 * @param tokenIdOrAddress - The token ID or address.
 * @returns The token ID.
 */
export function from(tokenIdOrAddress: TokenIdOrAddress | number): TokenId {
  if (
    typeof tokenIdOrAddress === 'bigint' ||
    typeof tokenIdOrAddress === 'number'
  )
    return BigInt(tokenIdOrAddress)
  return fromAddress(tokenIdOrAddress)
}

/**
 * Converts a TIP-20 token address to a token ID.
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenId } from 'ox/tempo'
 *
 * const tokenId = TokenId.fromAddress('0x20c00000000000000000000000000000000000000001')
 * ```
 *
 * @param address - The token address.
 * @returns The token ID.
 */
export function fromAddress(address: Address.Address): TokenId {
  if (!address.toLowerCase().startsWith(tip20Prefix))
    throw new Error('invalid tip20 address.')
  return Hex.toBigInt(Hex.slice(address, tip20Prefix.length))
}

/**
 * Converts a TIP-20 token ID to an address.
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenId } from 'ox/tempo'
 *
 * const address = TokenId.toAddress(1n)
 * ```
 *
 * @param tokenId - The token ID.
 * @returns The address.
 */
export function toAddress(tokenId: TokenIdOrAddress): Address.Address {
  if (typeof tokenId === 'string') {
    Address.assert(tokenId)
    return tokenId
  }

  const tokenIdHex = Hex.fromNumber(tokenId, { size: 18 })
  return Hex.concat(tip20Prefix, tokenIdHex)
}

/**
 * Computes a deterministic TIP-20 token address from a sender address and salt.
 *
 * The address is computed as: `TIP20_PREFIX (12 bytes) || keccak256(abi.encode(sender, salt))[:8]`
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenId } from 'ox/tempo'
 *
 * const id = TokenId.compute({
 *   sender: '0x1234567890123456789012345678901234567890',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
 * })
 * ```
 *
 * @param value - The sender address and salt.
 * @returns The computed TIP-20 token id.
 */
export function compute(value: compute.Value): bigint {
  const hash = Hash.keccak256(
    AbiParameters.encode(AbiParameters.from('address, bytes32'), [
      value.sender,
      value.salt,
    ]),
  )
  return Hex.toBigInt(Hex.slice(hash, 0, 8))
}

export declare namespace compute {
  export type Value = {
    /** The salt (32 bytes). */
    salt: Hex.Hex
    /** The sender address. */
    sender: Address.Address
  }
}
