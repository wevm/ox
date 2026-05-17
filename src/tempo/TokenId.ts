import { keccak_256 } from '@noble/hashes/sha3.js'
import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Hex from '../core/Hex.js'

const tip20Prefix = '0x20c0'

export type TokenId = bigint
export type TokenIdOrAddress<addressType = Address.Address> =
  | TokenId
  | addressType

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
 * const tokenId = TokenId.fromAddress('0x20c0000000000000000000000000000000000001')
 * ```
 *
 * @param address - The token address.
 * @returns The token ID.
 */
export function fromAddress(address: Address.Address): TokenId {
  const resolved = address
  // The TIP-20 prefix check is case-insensitive, but most inputs are already
  // lowercase, so peek the prefix bytes before falling back to a full
  // `.toLowerCase()`.
  const c2 = resolved.charCodeAt(2)
  const c3 = resolved.charCodeAt(3)
  const c4 = resolved.charCodeAt(4)
  const c5 = resolved.charCodeAt(5)
  const isPrefix =
    c2 === 50 /* '2' */ &&
    c3 === 48 /* '0' */ &&
    (c4 === 99 || c4 === 67) /* 'c' or 'C' */ &&
    c5 === 48 /* '0' */
  if (!isPrefix) throw new Error('invalid tip20 address.')
  // The trailing 36 hex characters encode the token id big-endian.
  return BigInt(`0x${resolved.slice(tip20Prefix.length)}`)
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
export function toAddress(
  tokenId: TokenIdOrAddress<Address.Address>,
): Address.Address {
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
  // ABI encoding of (address, bytes32) is the 32-byte left-padded address
  // followed by the 32-byte salt. Build that 64-byte buffer directly and hash
  // it, instead of round-tripping through `AbiParameters.encode`.
  const buffer = new Uint8Array(64)
  const addressBytes = Bytes.fromHex(value.sender)
  buffer.set(addressBytes, 12)
  buffer.set(Bytes.fromHex(value.salt, { size: 32 }), 32)
  const hash = keccak_256(buffer)
  // First 8 bytes of the digest, big-endian.
  let id = 0n
  for (let i = 0; i < 8; i++) id = (id << 8n) | BigInt(hash[i]!)
  return id
}

export declare namespace compute {
  export type Value = {
    /** The salt (32 bytes). */
    salt: Hex.Hex
    /** The sender address. */
    sender: Address.Address
  }
}
